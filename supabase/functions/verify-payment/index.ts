// POST { orderId } → checks Lipila's collection status and, if paid,
// marks the order paid in the database. This is the ONLY place
// orders.payment_status should ever be set to "paid" from a payment flow —
// it happens here, server-side, after actually checking with Lipila, not
// because the app says so. Deploy with: supabase functions deploy verify-payment

import { corsHeaders, requireUser, serviceClient, loadOwnedOrder, lipilaFetch } from "../_shared/lipila.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    if (!userId) {
      return json({ error: "Not signed in." }, 401);
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return json({ error: "Missing orderId." }, 400);
    }

    const db = serviceClient();
    const order = await loadOwnedOrder(db, orderId, userId);
    if (!order) {
      return json({ error: "Order not found." }, 404);
    }

    if (order.payment_status === "paid") {
      return json({ status: "paid" });
    }

    const { ok, json: lipilaBody } = await lipilaFetch(
      `/collections/check-status?referenceId=${encodeURIComponent(order.id)}`,
      null
    );
    if (!ok) {
      return json({ status: "pending" });
    }

    const providerStatus = String(lipilaBody?.status || "").toLowerCase();

    if (providerStatus === "successful" || providerStatus === "success") {
      await db.from("orders").update({ payment_status: "paid" }).eq("id", order.id);
      return json({ status: "paid" });
    }
    if (providerStatus === "failed") {
      await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      return json({ status: "failed", reason: lipilaBody?.message });
    }

    return json({ status: "pending" });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
