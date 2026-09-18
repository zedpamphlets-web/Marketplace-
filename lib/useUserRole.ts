import { useEffect, useState } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export type UserRole =
  | { type: "guest" }
  | { type: "customer"; userId: string }
  | { type: "super_admin"; userId: string }
  | { type: "shop_admin"; userId: string; shopId: string }
  | { type: "rider"; userId: string };

async function resolveRole(): Promise<UserRole> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return { type: "guest" };

  const userId = user.id;

  const [{ data: admin }, { data: shopAdmin }, { data: rider }] = await Promise.all([
    supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("shop_admins").select("shop_id").eq("user_id", userId).maybeSingle(),
    supabase.from("riders").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (admin) return { type: "super_admin", userId };
  if (shopAdmin?.shop_id) return { type: "shop_admin", userId, shopId: shopAdmin.shop_id };
  if (rider) return { type: "rider", userId };
  return { type: "customer", userId };
}

/** Unchanged — existing screens read `role.type` / `role.shopId` from this. */
export function useUserRole(): UserRole {
  const [role, setRole] = useState<UserRole>({ type: "guest" });

  useEffect(() => {
    let active = true;
    const run = async () => {
      const next = await resolveRole();
      if (active) setRole(next);
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange(() => run());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return role;
}

/**
 * Route guard for admin/shop-admin/rider sections. Renders nothing and
 * redirects away until the role is confirmed — this is what actually keeps
 * a random signed-in customer (or guest) from even seeing the admin screens,
 * on top of the database RLS that blocks their reads/writes either way.
 */
export function useRequireRole(allowed: UserRole["type"][], redirectTo = "/(tabs)") {
  const [role, setRole] = useState<UserRole>({ type: "guest" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const next = await resolveRole();
      if (!active) return;
      setRole(next);
      setLoaded(true);
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange(() => run());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loaded && !allowed.includes(role.type)) {
      router.replace(redirectTo);
    }
  }, [loaded, role.type]);

  return { role, loaded, allowed: loaded && allowed.includes(role.type) };
}
