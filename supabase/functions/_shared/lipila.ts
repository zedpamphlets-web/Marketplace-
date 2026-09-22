// Shared helpers for the create-payment / verify-payment Edge Functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const LIPILA_BASE_URL = Deno.env.get("LIPILA_BASE_URL") || "https://blz.lipila.io/api/v1";
const LIPILA_SECRET_KEY = Deno.env.get("LIPILA_SECRET_KEY") || "";

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

export async function requireUser(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/** Load order group owned by this customer. */
export async function loadOwnedGroup(
  db: ReturnType<typeof serviceClient>,
  groupId: string,
  userId: string
) {
  const { data: group, error } = await db
    .from("order_groups")
    .select("id, customer_id, total, payment_status")
    .eq("id", groupId)
    .maybeSingle();
  if (error || !group) return null;
  if (group.customer_id === userId) return group;
  if (await isPlatformAdmin(db, userId)) return group;
  return null;
}

async function isPlatformAdmin(db: ReturnType<typeof serviceClient>, userId: string) {
  const { data } = await db.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

/** @deprecated single-order path — kept for older clients */
export async function loadOwnedOrder(
  db: ReturnType<typeof serviceClient>,
  orderId: string,
  userId: string
) {
  const { data: order, error } = await db
    .from("orders")
    .select("id, shop_id, customer_id, total, payment_status, group_id")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) return null;
  if (order.customer_id === userId) return order;

  const { data: shopAdmin } = await db
    .from("shop_admins")
    .select("shop_id")
    .eq("user_id", userId)
    .eq("shop_id", order.shop_id)
    .maybeSingle();
  if (shopAdmin) return order;
  return null;
}

export async function lipilaFetch(path: string, body: unknown) {
  if (!LIPILA_SECRET_KEY) {
    throw new Error("LIPILA_SECRET_KEY is not set — run: supabase secrets set LIPILA_SECRET_KEY=...");
  }
  const res = await fetch(`${LIPILA_BASE_URL}${path}`, {
    method: path.includes("check-status") ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": LIPILA_SECRET_KEY,
    },
    body: path.includes("check-status") ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}
