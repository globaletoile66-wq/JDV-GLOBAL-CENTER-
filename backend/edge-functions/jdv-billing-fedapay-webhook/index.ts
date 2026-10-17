// BROUILLON NON DÉPLOYÉ, NON TESTÉ. Déployer avec --no-verify-jwt (webhook).
// Règles : signature vérifiée ; statut RE-VÉRIFIÉ auprès de FedaPay ; montant comparé à l'intention enregistrée en base ;
// activation idempotente via billing_activate_subscription (service uniquement).
// À VÉRIFIER dans la documentation FedaPay : en-tête et calcul exacts de la signature (même schéma que les autres webhooks du projet).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const secret = Deno.env.get("FEDAPAY_WEBHOOK_SECRET") || "";
const fedapayKey = Deno.env.get("FEDAPAY_API_KEY") || "";
const fedapayBase = (Deno.env.get("FEDAPAY_API_BASE_URL") || "https://api.fedapay.com/v1").replace(/\/$/, "");

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function sign(body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
}
const same = (a: string, b: string) => { if (a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; };

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "POST_REQUIRED" }, { status: 405 });
  if (!secret || !fedapayKey) return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  const raw = await req.text();
  const supplied = (req.headers.get("x-fedapay-signature") || "").replace(/^sha256=/i, "").trim();
  if (!same(supplied, await sign(raw))) return Response.json({ error: "INVALID_SIGNATURE" }, { status: 401 });

  try {
    const payload = JSON.parse(raw);
    const entity = payload?.entity ?? payload?.["v1/transaction"] ?? payload?.data ?? payload;
    const providerId = String(entity?.id ?? "");
    if (!providerId) return Response.json({ ok: true, ignored: "NO_ID" });

    const { data: co } = await admin.from("billing_checkouts").select("*").eq("provider", "fedapay").eq("provider_transaction_id", providerId).maybeSingle();
    if (!co) return Response.json({ ok: true, ignored: "CHECKOUT_NOT_FOUND" });
    if (co.status === "approved") return Response.json({ ok: true, already: true });

    const check = await fetch(`${fedapayBase}/transactions/${providerId}`, { headers: { Authorization: `Bearer ${fedapayKey}` } });
    const cj = await check.json().catch(() => ({}));
    const tx = cj?.["v1/transaction"] ?? cj?.transaction ?? cj;
    if (!check.ok) return Response.json({ ok: false, error: "VERIFY_FAILED" }, { status: 502 });
    const status = String(tx?.status ?? "").toLowerCase();

    if (status === "approved") {
      if (Number(tx?.amount) !== Number(co.amount_xof)) {
        await admin.from("billing_checkouts").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", co.id);
        return Response.json({ ok: false, error: "AMOUNT_MISMATCH" }, { status: 409 });
      }
      const { data: plan } = await admin.from("subscription_plans").select("code").eq("id", co.plan_id).single();
      const { error } = await admin.rpc("billing_activate_subscription", {
        p_user_id: co.organization_id ? null : co.user_id, p_organization_id: co.organization_id, p_plan_code: plan!.code,
        p_amount: co.amount, p_currency: co.currency, p_provider: "fedapay", p_provider_reference: providerId, p_checkout_id: co.id,
        p_metadata: { amount_xof: co.amount_xof, paid_by: co.user_id },
      });
      if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
      return Response.json({ ok: true, activated: true });
    }
    if (["declined", "canceled", "cancelled", "refunded"].includes(status)) {
      await admin.from("billing_checkouts").update({ status: status.startsWith("cancel") || status === "canceled" ? "cancelled" : "declined", updated_at: new Date().toISOString() }).eq("id", co.id);
    }
    return Response.json({ ok: true, status });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
});
