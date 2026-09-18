// POST { provider, orderId, phone } → starts a Lipila mobile-money collection.
// The Lipila secret key stays server-side (Deno.env) and is never sent to
// the app. Deploy with: supabase functions deploy create-payment

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

    const { orderId, phone } = await req.json();
    if (!orderId || !phone) {
      return json({ error: "Missing orderId or phone." }, 400);
    }

    const db = serviceClient();
    const order = await loadOwnedOrder(db, orderId, userId);
    if (!order) {
      return json({ error: "Order not found." }, 404);
    }
    if (order.payment_status === "paid") {
      return json({ error: "This order is already paid." }, 409);
    }

    // Amount comes from the order row in the database — set by
    // create_order() from real product prices — never from the request.
    const { ok, json: lipilaBody } = await lipilaFetch("/collections/mobile-money", {
      referenceId: order.id,
      amount: order.total,
      narration: `Order ${order.id}`,
      accountNumber: phone,
      currency: "ZMW",
    });

    if (!ok) {
      return json({ error: lipilaBody?.message || "Could not start payment." }, 502);
    }

    return json({ status: "pending", ...lipilaBody });
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
