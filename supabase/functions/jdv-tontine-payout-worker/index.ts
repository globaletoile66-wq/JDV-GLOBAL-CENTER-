import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const fedapayKey = Deno.env.get("FEDAPAY_API_KEY") ?? "";
const fedapayMode = Deno.env.get("FEDAPAY_PAYOUT_MODE") ?? "mtn_open";
const fedapayBase = (Deno.env.get("FEDAPAY_API_BASE_URL") ?? "https://api.fedapay.com/v1").replace(/\/$/, "");

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fail(id: string, message: string) {
  const { error } = await admin.rpc("tontine_record_dispatch_failure", {
    p_dispatch_id: id,
    p_error: message,
    p_retry_after_minutes: 15,
  });
  if (error) throw error;
}

function isTrustedWorker(req: Request): boolean {
  if (!serviceKey) return false;
  const header = req.headers.get("Authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
  if (token.length !== serviceKey.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ serviceKey.charCodeAt(i);
  return diff === 0;
}

async function processOne(id: string) {
  const claim = await admin.rpc("tontine_claim_due_dispatch", { p_dispatch_id: id });
  if (claim.error) throw claim.error;
  if (!claim.data?.claimed) return { id, skipped: true };

  if (!fedapayKey) {
    await fail(id, "FEDAPAY_API_KEY_NOT_CONFIGURED");
    return { id, configured: false };
  }

  const dispatch = claim.data;
  try {
    const createRes = await fetch(fedapayBase + "/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fedapayKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(dispatch.amount),
        currency: { iso: "XOF" },
        mode: fedapayMode,
        customer: { phone_number: dispatch.phone },
        merchant_reference: dispatch.idempotency_key,
      }),
    });
    const createText = await createRes.text();
    if (!createRes.ok) throw new Error(`FEDAPAY_CREATE_${createRes.status}: ${createText.slice(0, 1000)}`);

    const created = JSON.parse(createText);
    const payout = created?.v1?.payout || created?.payout || created?.data || created;
    const providerId = String(payout?.id ?? payout?.payout_id ?? "");
    const providerRef = payout?.reference ? String(payout.reference) : null;
    if (!providerId) throw new Error("FEDAPAY_CREATE_NO_ID");

    const startRes = await fetch(fedapayBase + "/payouts/start", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${fedapayKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payout_ids: [Number(providerId)] }),
    });
    const startText = await startRes.text();
    if (!startRes.ok) throw new Error(`FEDAPAY_START_${startRes.status}: ${startText.slice(0, 1000)}`);

    const { error } = await admin.rpc("tontine_record_dispatch_sent", {
      p_dispatch_id: id,
      p_provider_request_id: providerId,
      p_provider_reference: providerRef,
    });
    if (error) throw error;
    return { id, sent: true, provider_id: providerId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await fail(id, message);
    return { id, sent: false, error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST_REQUIRED" }, { status: 405 });
  }
  if (!serviceKey || !supabaseUrl) {
    return Response.json({ error: "WORKER_NOT_CONFIGURED" }, { status: 503 });
  }
  // Supabase's JWT gateway accepts ordinary authenticated users too. Require the
  // exact service-role bearer token before any queue read or payout side effect.
  if (!isTrustedWorker(req)) {
    return Response.json({ error: "SERVICE_ROLE_REQUIRED" }, { status: 401 });
  }

  try {
    const { data: queued, error: queueError } = await admin.rpc("tontine_queue_due_payouts");
    if (queueError) throw queueError;

    const { data: dispatches, error: dispatchError } = await admin
      .from("tontine_payout_dispatches")
      .select("id")
      .eq("status", "queued")
      .lte("next_attempt_at", new Date().toISOString())
      .order("queued_at", { ascending: true })
      .limit(20);
    if (dispatchError) throw dispatchError;

    const results = [];
    for (const row of dispatches ?? []) results.push(await processOne(row.id));
    return Response.json({ ok: true, queued: queued ?? 0, processed: results.length, results });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
});
