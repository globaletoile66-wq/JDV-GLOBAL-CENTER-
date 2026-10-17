// BROUILLON NON DÉPLOYÉ, NON TESTÉ avec FedaPay. Crée une intention de paiement pour un abonnement de branche et renvoie le lien de paiement.
// Règles : JWT obligatoire ; abonnement au nom d'une organisation réservé à ses administrateurs ; le montant vient TOUJOURS de la base ;
// la formule doit avoir un montant en XOF (billing_amount_xof) pour être payable via FedaPay.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
const fedapayKey = Deno.env.get("FEDAPAY_API_KEY") || "";
const fedapayBase = (Deno.env.get("FEDAPAY_API_BASE_URL") || "https://api.fedapay.com/v1").replace(/\/$/, "");
const returnUrl = Deno.env.get("BILLING_RETURN_URL") || "";
const reply = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST requis" }, 405);
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return reply({ error: "Authentification requise" }, 401);
  if (!fedapayKey) return reply({ error: "Paiement non configuré" }, 503);

  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return reply({ error: "Session invalide" }, 401);

  const body = await req.json().catch(() => ({}));
  const planCode = String(body?.plan_code ?? "");
  const orgId = body?.organization_id ? String(body.organization_id) : null;
  if (!planCode) return reply({ error: "plan_code requis" }, 400);

  if (orgId) {
    const { data: isAdmin } = await userClient.rpc("is_org_admin", { org_id: orgId });
    if (isAdmin !== true) return reply({ error: "Réservé aux administrateurs de l'organisation" }, 403);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: plan } = await admin.from("subscription_plans").select("id,code,module_code,name,price,currency,billing_amount_xof,active").eq("code", planCode).maybeSingle();
  if (!plan || !plan.active) return reply({ error: "Formule introuvable" }, 404);
  if (!plan.billing_amount_xof || Number(plan.billing_amount_xof) <= 0) return reply({ error: "Cette formule n'est pas encore payable en ligne" }, 422);

  const { data: checkout, error: ce } = await admin.from("billing_checkouts").insert({
    user_id: user.id, organization_id: orgId, plan_id: plan.id, module_code: plan.module_code,
    amount: plan.price, currency: plan.currency, amount_xof: plan.billing_amount_xof,
  }).select("id").single();
  if (ce || !checkout) return reply({ error: "Création du paiement impossible" }, 500);

  const headers = { Authorization: `Bearer ${fedapayKey}`, "Content-Type": "application/json" };
  const cr = await fetch(`${fedapayBase}/transactions`, {
    method: "POST", headers,
    body: JSON.stringify({ description: `Abonnement ${plan.name}`, amount: Number(plan.billing_amount_xof), currency: { iso: "XOF" }, callback_url: returnUrl || undefined, merchant_reference: checkout.id }),
  });
  const cj = await cr.json().catch(() => ({}));
  const tx = cj?.["v1/transaction"] ?? cj?.transaction ?? cj;
  const providerId = String(tx?.id ?? "");
  if (!cr.ok || !providerId) { await admin.from("billing_checkouts").update({ status: "declined" }).eq("id", checkout.id); return reply({ error: "Fournisseur de paiement indisponible" }, 502); }
  await admin.from("billing_checkouts").update({ provider_transaction_id: providerId, updated_at: new Date().toISOString() }).eq("id", checkout.id);

  const tr = await fetch(`${fedapayBase}/transactions/${providerId}/token`, { method: "POST", headers });
  const tj = await tr.json().catch(() => ({}));
  const url = tj?.url ?? tj?.["v1/token"]?.url ?? null;
  if (!tr.ok || !url) return reply({ error: "Lien de paiement indisponible" }, 502);
  return reply({ checkout_id: checkout.id, payment_url: url });
});
