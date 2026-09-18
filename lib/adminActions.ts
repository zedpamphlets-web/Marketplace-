import { supabase } from "./supabase";

/** When a user logs in, attach any pending shop invite for their email. */
export async function acceptPendingShopInvite() {
  try {
    // Must go through the security-definer RPC — shop_admins/shop_invites
    // have no client-writable RLS policy on purpose (see
    // supabase/security-fixes.sql), so a direct client-side upsert here
    // would always be rejected and could otherwise be used to self-grant
    // shop-admin access to an arbitrary shop.
    const { data, error } = await supabase.rpc("accept_shop_invite");
    if (!error && data) return data as string;
    return null;
  } catch (e) {
    console.warn("accept_shop_invite failed", e);
    return null;
  }
}

export function kwacha(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return `K ${v.toLocaleString("en-ZM", { maximumFractionDigits: 2 })}`;
}
