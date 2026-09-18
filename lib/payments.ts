import { paymentEndpoints } from "@/lib/config";
import { supabase, SUPABASE_ANON_KEY } from "@/lib/supabase";
import type { LipilaProvider } from "@/lib/lipila";

export const MAX_POLL_ATTEMPTS = 24;

export function nextPollDelay(attempt: number) {
  return Math.min(3000 + attempt * 500, 8000);
}

/** Headers for calling our Supabase Edge Functions: the user's own access
 * token, so the function can verify the caller actually owns the order
 * before touching Lipila or the database — never trust the orderId alone. */
async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
  };
}

export async function startLipilaPayment(input: {
  provider: LipilaProvider;
  orderId: string;
  phone: string;
}) {
  if (!paymentEndpoints.createPayment) {
    throw new Error("Payment API is not configured.");
  }
  const res = await fetch(paymentEndpoints.createPayment, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message || body?.error || "Could not start payment.");
  }
  return body;
}

export async function verifyLipilaPayment(orderId: string): Promise<{
  status: "paid" | "failed" | "pending";
  reason?: string;
}> {
  if (!paymentEndpoints.verifyPayment) {
    return { status: "pending" };
  }
  const res = await fetch(paymentEndpoints.verifyPayment, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ orderId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { status: "pending" };
  }
  const status = body?.status as string;
  if (status === "paid" || status === "success") return { status: "paid" };
  if (status === "failed" || status === "cancelled") {
    return { status: "failed", reason: body?.reason || body?.message };
  }
  return { status: "pending" };
}
