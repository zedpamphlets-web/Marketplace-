// POST { provider, groupId, phone } → Lipila collection for an order group.
import { corsHeaders, requireUser, serviceClient, loadOwnedGroup, loadOwnedOrder, lipilaFetch } from "../_shared/lipila.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    if (!userId) {
      return json({ error: "Not signed in." }, 401);
    }

    const body = await req.json();
    const groupId = body.groupId || body.orderId;
    const phone = body.phone;
    if (!groupId || !phone) {
      return json({ error: "Missing groupId or phone." }, 400);
    }

    const db = serviceClient();

    // Prefer order group; fall back to single order for legacy clients
    let referenceId = groupId;
    let amount = 0;
    let alreadyPaid = false;

    const group = await loadOwnedGroup(db, groupId, userId);
    if (group) {
      amount = Number(group.total);
      alreadyPaid = group.payment_status === "paid";
      referenceId = group.id;
    } else {
      const order = await loadOwnedOrder(db, groupId, userId);
      if (!order) {
        return json({ error: "Order group not found." }, 404);
      }
      amount = Number(order.total);
      alreadyPaid = order.payment_status === "paid";
      referenceId = order.id;
    }

    if (alreadyPaid) {
      return json({ error: "This order is already paid." }, 409);
    }

    const { ok, json: lipilaBody } = await lipilaFetch("/collections/mobile-money", {
      referenceId,
      amount,
      narration: `Order group ${referenceId}`,
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
