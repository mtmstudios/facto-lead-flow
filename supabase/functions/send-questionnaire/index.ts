import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const PUBLIC_BASE_URL = "https://leaddashboard-factonet.lovable.app";

function buildHtml(vorname: string, nachname: string, link: string) {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#222;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;">
    <p>Guten Tag ${vorname} ${nachname},</p>
    <p>vielen Dank für Ihr Interesse an der Forschungszulage.</p>
    <p>Damit wir Ihre Förderfähigkeit präzise einschätzen können, bitten wir Sie um Beantwortung weniger Fragen. Über folgenden Link können Sie den Fragebogen ausfüllen — Dauer ca. 5 Minuten:</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${link}" style="background:#307abe;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Fragebogen ausfüllen</a>
    </p>
    <p style="font-size:13px;color:#666;">Oder kopieren Sie diesen Link in Ihren Browser:<br/><a href="${link}">${link}</a></p>
    <p>Im Anschluss melden wir uns innerhalb von 48 Stunden mit der Auswertung bei Ihnen.</p>
    <p>Bei Rückfragen erreichen Sie uns jederzeit per Antwort auf diese Mail.</p>
    <p>Mit freundlichen Grüßen<br/>PCA Partners</p>
  </body></html>`;
}

function buildText(vorname: string, nachname: string, link: string) {
  return `Guten Tag ${vorname} ${nachname},

vielen Dank für Ihr Interesse an der Forschungszulage.

Damit wir Ihre Förderfähigkeit präzise einschätzen können, bitten wir Sie um Beantwortung weniger Fragen. Über folgenden Link können Sie den Fragebogen ausfüllen — Dauer ca. 5 Minuten:

${link}

Im Anschluss melden wir uns innerhalb von 48 Stunden mit der Auswertung bei Ihnen.

Mit freundlichen Grüßen
PCA Partners`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const expectedKey = Deno.env.get("LEAD_INGEST_API_KEY");
    if (expectedKey) {
      const provided = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (provided !== expectedKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: lead, error: leadErr } = await supabase.from("leads").select("*").eq("id", lead_id).single();
    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!lead.email) {
      return new Response(JSON.stringify({ error: "Lead hat keine E-Mail-Adresse" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let token = lead.fragebogen_token;
    if (!token) {
      token = crypto.randomUUID();
    }

    const { error: updErr } = await supabase.from("leads").update({
      fragebogen_token: token,
      fragebogen_versendet_am: new Date().toISOString(),
    }).eq("id", lead_id);
    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const link = `${PUBLIC_BASE_URL}/fragebogen/${token}`;
    const subject = "Ihr Fragebogen zur Forschungszulage — kurze Ersteinschätzung";
    const html = buildHtml(lead.vorname, lead.nachname, link);
    const text = buildText(lead.vorname, lead.nachname, link);

    const webhookUrl = Deno.env.get("MAIL_SEND_WEBHOOK_URL");
    let mailSent = false;
    let mailError: string | null = null;
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: lead.email,
            subject,
            html,
            text,
            lead_data: {
              id: lead.id,
              vorname: lead.vorname,
              nachname: lead.nachname,
              unternehmen: lead.unternehmen,
              email: lead.email,
            },
            link,
            token,
          }),
        });
        mailSent = res.ok;
        if (!res.ok) mailError = `Webhook returned ${res.status}`;
      } catch (e) {
        mailError = (e as Error).message;
      }
    } else {
      mailError = "MAIL_SEND_WEBHOOK_URL not configured";
    }

    return new Response(JSON.stringify({ success: true, token, link, mail_sent: mailSent, mail_error: mailError }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Ungültige Anfrage" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
