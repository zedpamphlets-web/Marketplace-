import { CREATE_PAYMENT_URL, VERIFY_PAYMENT_URL } from "@/lib/config";
import { supabase, SUPABASE_ANON_KEY } from "@/lib/supabase";
import type { LipilaProvider } from "@/lib/lipila";
import { toZambianMsisdn } from "@/lib/lipila";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: SUPABASE_ANON_KEY,
  };
}

/** Start a Lipila collection against an order group (multi-shop checkout). */
export async function startLipilaPayment(opts: {
  provider: LipilaProvider;
  groupId: string;
  phone: string;
}) {
  if (!CREATE_PAYMENT_URL) {
    throw new Error("Payment API URL is not configured.");
  }
  const headers = await authHeaders();
  const res = await fetch(CREATE_PAYMENT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider: opts.provider,
      groupId: opts.groupId,
      phone: toZambianMsisdn(opts.phone),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `Payment start failed (${res.status})`);
  }
  return body;
}

/** Poll Lipila status for a group; server marks all orders in the group paid. */
export async function verifyLipilaPayment(groupId: string): Promise<{
  status: "paid" | "pending" | "failed" | string;
  reason?: string;
  error?: string;
}> {
  try {
    const headers = await authHeaders();
    const res = await fetch(VERIFY_PAYMENT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ groupId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { status: "pending", error: body?.error };
    }
    return body;
  } catch (e: any) {
    return { status: "pending", error: e?.message };
  }
}
