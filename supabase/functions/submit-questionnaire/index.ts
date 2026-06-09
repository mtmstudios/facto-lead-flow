import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_FIELDS = [
  "steuerpflichtig_de",
  "unternehmen_schwierigkeiten",
  "verbundene_unternehmen",
  "entwicklung_herausforderungen",
  "reine_produktentwicklung",
  "wissenschaftliche_risiken",
  "entwicklungsplan",
  "auftragnehmer_beteiligt",
  "auftragnehmer_aufgabe",
  "entwicklungsaufwand_4j",
  "ma_in_entwicklung",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const token = parts[parts.length - 1];

    if (!token || token === "submit-questionnaire") {
      return new Response(JSON.stringify({ error: "Token required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, vorname, nachname, unternehmen, fragebogen_beantwortet_am")
      .eq("fragebogen_token", token)
      .maybeSingle();

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (lead.fragebogen_beantwortet_am) {
      return new Response(JSON.stringify({ status: "already_answered" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const update: Record<string, unknown> = { fragebogen_beantwortet_am: new Date().toISOString() };
    for (const f of ALLOWED_FIELDS) {
      if (f in body) update[f] = body[f];
    }

    const { error: updErr } = await supabase.from("leads").update(update).eq("id", lead.id);
    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Activity log
    await supabase.from("aktivitaeten").insert({
      lead_id: lead.id,
      typ: "Fragenkatalog",
      beschreibung: "Kunde hat den Fragebogen ausgefüllt.",
      erstellt_von: "Kunde (Magic-Link)",
    });

    // Notify webhook
    const notifyUrl = Deno.env.get("QUESTIONNAIRE_ANSWERED_WEBHOOK_URL");
    if (notifyUrl) {
      try {
        await fetch(notifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: lead.id,
            lead_name: `${lead.vorname} ${lead.nachname}`,
            lead_unternehmen: lead.unternehmen,
          }),
        });
      } catch (_) {
        // non-fatal
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
