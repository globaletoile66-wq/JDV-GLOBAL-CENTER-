import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Channel = "email" | "sms" | "whatsapp";
type Alert = {
  id: string; alert_type: string; title: string; message: string;
  action_url: string | null; organization_id: string | null;
  created_at: string; last_triggered_at: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const rawAppBaseUrl = Deno.env.get("CRM_APP_BASE_URL") || "";
  const appBaseUrl = rawAppBaseUrl.endsWith("/") ? rawAppBaseUrl.slice(0, -1) : rawAppBaseUrl;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Supabase function secrets are incomplete" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401);
  const user = userData.user;

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: pref, error: prefError } = await admin
    .from("crm_notification_preferences")
    .select("email_enabled,sms_enabled,whatsapp_enabled,phone_e164")
    .eq("user_id", user.id)
    .maybeSingle();
  if (prefError) return json({ error: "Could not read notification preferences" }, 500);
  if (!pref || (!pref.email_enabled && !pref.sms_enabled && !pref.whatsapp_enabled)) {
    return json({ ok: true, sent: 0, message: "No outbound channels enabled." });
  }

  const { data: alerts, error: alertsError } = await admin
    .from("crm_automation_alerts")
    .select("id,alert_type,title,message,action_url,organization_id,created_at,last_triggered_at")
    .eq("recipient_user_id", user.id)
    .eq("active", true)
    .order("last_triggered_at", { ascending: false })
    .limit(25);
  if (alertsError) return json({ error: "Could not load CRM alerts" }, 500);
  if (!alerts?.length) return json({ ok: true, sent: 0, message: "No active alerts." });

  const configured: Record<Channel, boolean> = {
    email: pref.email_enabled && !!Deno.env.get("RESEND_API_KEY") && !!Deno.env.get("CRM_MAIL_FROM") && !!user.email,
    sms: pref.sms_enabled && !!Deno.env.get("TWILIO_ACCOUNT_SID") && !!Deno.env.get("TWILIO_AUTH_TOKEN") && !!Deno.env.get("TWILIO_SMS_FROM") && !!pref.phone_e164,
    whatsapp: pref.whatsapp_enabled && !!Deno.env.get("TWILIO_ACCOUNT_SID") && !!Deno.env.get("TWILIO_AUTH_TOKEN") && !!Deno.env.get("TWILIO_WHATSAPP_FROM") && !!pref.phone_e164,
  };
  const missing: string[] = [];
  if (pref.email_enabled && !configured.email) missing.push("email provider/sender or user email");
  if (pref.sms_enabled && !configured.sms) missing.push("Twilio SMS credentials/sender or user phone");
  if (pref.whatsapp_enabled && !configured.whatsapp) missing.push("Twilio WhatsApp sender/credentials or user phone");
  if (missing.length && !Object.values(configured).some(Boolean)) {
    return json({ ok: false, sent: 0, missing_configuration: missing }, 424);
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const channels = (Object.keys(configured) as Channel[]).filter((c) => configured[c]);

  for (const alert of alerts as Alert[]) {
    for (const channel of channels) {
      const { data: existing, error: checkError } = await admin
        .from("crm_automation_deliveries")
        .select("id,status,attempt_count")
        .eq("alert_id", alert.id)
        .eq("channel", channel)
        .maybeSingle();
      if (checkError) { failed++; errors.push("delivery ledger lookup failed"); continue; }
      if (existing?.status === "sent" || (existing && existing.attempt_count >= 5)) continue;

      const deliveryId = existing?.id;
      const attemptCount = (existing?.attempt_count ?? 0) + 1;
      const now = new Date().toISOString();
      const row = {
        alert_id: alert.id, user_id: user.id, channel,
        status: "pending", attempt_count: attemptCount, last_error: null, updated_at: now,
      };
      const upsert = await admin.from("crm_automation_deliveries")
        .upsert(deliveryId ? { ...row, id: deliveryId } : row, { onConflict: "alert_id,channel" })
        .select("id").single();
      if (upsert.error) { failed++; errors.push("could not reserve delivery"); continue; }

      const textBody = [alert.title, alert.message, alert.action_url ? `Open in JDV Global Center: ${appBaseUrl}${alert.action_url}` : ""].filter(Boolean).join("\n");
      let providerId: string | null = null;
      let errorText: string | null = null;
      try {
        if (channel === "email") {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: Deno.env.get("CRM_MAIL_FROM"),
              to: [user.email],
              subject: `[JDV CRM] ${alert.title}`,
              text: textBody,
            }),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(`Resend HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 500)}`);
          providerId = payload.id ?? null;
        } else {
          const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
          const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
          const from = channel === "sms" ? Deno.env.get("TWILIO_SMS_FROM")! : Deno.env.get("TWILIO_WHATSAPP_FROM")!;
          const to = channel === "whatsapp" ? `whatsapp:${pref.phone_e164}` : pref.phone_e164!;
          const params = new URLSearchParams({ From: channel === "whatsapp" ? (from.startsWith("whatsapp:") ? from : `whatsapp:${from}`) : from, To: to, Body: textBody.slice(0, 1500) });
          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${sid}:${token}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(`Twilio HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 500)}`);
          providerId = payload.sid ?? null;
        }
        await admin.from("crm_automation_deliveries").update({
          status: "sent", provider_message_id: providerId, sent_at: new Date().toISOString(),
          last_error: null, updated_at: new Date().toISOString(),
        }).eq("id", upsert.data.id);
        sent++;
      } catch (e) {
        errorText = e instanceof Error ? e.message : "Provider send failed";
        await admin.from("crm_automation_deliveries").update({
          status: "failed", last_error: errorText.slice(0, 1000), updated_at: new Date().toISOString(),
        }).eq("id", upsert.data.id);
        failed++;
        errors.push(`${channel}: ${errorText.slice(0, 180)}`);
      }
    }
  }
  return json({ ok: failed === 0, sent, failed, missing_configuration: missing, errors });
});
