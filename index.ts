import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      }
    });
  }

  try {
    const { inquiry_id, listing_title, buyer_name, buyer_email, message, seller_email, seller_name } = await req.json();

    // E-Mail an Händler
    const sellerEmail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "1A Motor <noreply@1amotor.de>",
        to: [seller_email],
        subject: `📨 Neue Anfrage: ${listing_title}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1a3a52;padding:24px;border-radius:12px 12px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:22px;">⚙️ 1A Motor</h1>
              <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px;">Neue Kaufanfrage eingegangen</p>
            </div>
            <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;">
              <h2 style="color:#1a3a52;margin:0 0 16px;">Neue Anfrage für: ${listing_title}</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:700;width:140px;color:#475569;">Käufer</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${buyer_name}</td></tr>
                <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:700;color:#475569;">E-Mail</td><td style="padding:8px 12px;border:1px solid #e2e8f0;"><a href="mailto:${buyer_email}" style="color:#2563eb;">${buyer_email}</a></td></tr>
                <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:700;color:#475569;">Anzeige</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${listing_title}</td></tr>
              </table>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;">
                <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Nachricht</div>
                <p style="color:#334155;white-space:pre-wrap;margin:0;">${message}</p>
              </div>
              <a href="https://1amotor.de/anfragen.html"
                style="display:inline-block;background:#1a3a52;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
                Jetzt antworten →
              </a>
            </div>
            <div style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#94a3b8;">
              1A Motor · Motorenmarktplatz Deutschland · <a href="https://1amotor.de" style="color:#94a3b8;">1amotor.de</a>
            </div>
          </div>
        `
      })
    });

    // E-Mail an Käufer (Bestätigung)
    const buyerEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "1A Motor <noreply@1amotor.de>",
        to: [buyer_email],
        subject: `✅ Deine Anfrage wurde gesendet: ${listing_title}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1a3a52;padding:24px;border-radius:12px 12px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:22px;">⚙️ 1A Motor</h1>
              <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px;">Deine Anfrage wurde gesendet</p>
            </div>
            <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;">
              <h2 style="color:#1a3a52;margin:0 0 12px;">Hallo ${buyer_name}!</h2>
              <p style="color:#475569;margin-bottom:20px;">Deine Anfrage für <strong>${listing_title}</strong> wurde erfolgreich an <strong>${seller_name}</strong> weitergeleitet. Du erhältst eine Antwort direkt hier oder per E-Mail.</p>
              <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin-bottom:20px;">
                <div style="font-size:12px;color:#059669;margin-bottom:6px;font-weight:700;">Deine Nachricht</div>
                <p style="color:#334155;white-space:pre-wrap;margin:0;">${message}</p>
              </div>
              <a href="https://1amotor.de/meine-anfragen.html"
                style="display:inline-block;background:#1a3a52;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
                Meine Anfragen ansehen →
              </a>
            </div>
            <div style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#94a3b8;">
              1A Motor · <a href="https://1amotor.de" style="color:#94a3b8;">1amotor.de</a>
            </div>
          </div>
        `
      })
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
