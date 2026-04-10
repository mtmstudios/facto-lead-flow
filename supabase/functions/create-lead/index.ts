import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function berechnePrioritaet(mitarbeiter: string | null, entwicklung: string | null): string {
  const isLargeCompany = mitarbeiter === "50–249" || mitarbeiter === "250+";
  const isMediumCompany = mitarbeiter === "10–49";
  const hasRegularDev = entwicklung === "Ja, regelmäßig";
  const hasOccasionalDev = entwicklung === "Ja, gelegentlich";

  if (isLargeCompany && hasRegularDev) return "Hoch";
  if (isMediumCompany || hasOccasionalDev) return "Mittel";
  return "Niedrig";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const { vorname, nachname, email, telefon, unternehmen, mitarbeiter, entwicklung, rechner_ergebnis, branche, quelle, utm_source, utm_medium, utm_campaign, utm_content } = body;

    if (!vorname || !nachname) {
      return new Response(JSON.stringify({ error: "vorname und nachname sind erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prioritaet = berechnePrioritaet(mitarbeiter || null, entwicklung || null);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.from("leads").insert({
      vorname,
      nachname,
      email: email || null,
      telefon: telefon || null,
      unternehmen: unternehmen || null,
      mitarbeiter: mitarbeiter || null,
      entwicklung: entwicklung || null,
      rechner_ergebnis: rechner_ergebnis || null,
      branche: branche || null,
      quelle: quelle || "Meta Ads",
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      status: "Neu",
      prioritaet,
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, lead: data }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Ungültige Anfrage" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
