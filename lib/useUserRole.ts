import { useEffect, useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

const ROLE_CACHE_KEY = "user_role_cache_v1";

async function saveRoleCache(role: UserRole) {
  try {
    await AsyncStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(role));
  } catch { /* ignore */ }
}

async function readRoleCache(): Promise<UserRole | null> {
  try {
    const raw = await AsyncStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserRole;
  } catch {
    return null;
  }
}

export type UserRole =
  | { type: "guest" }
  | { type: "customer"; userId: string }
  | { type: "super_admin"; userId: string }
  | { type: "shop_admin"; userId: string; shopId: string }
  | { type: "rider"; userId: string };

/**
 * Resolve role from session + optional role tables.
 * If the user has a valid session but the role-table queries fail
 * (e.g. offline), treat them as a signed-in customer — never force guest.
 */
async function resolveRole(): Promise<UserRole> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return { type: "guest" };

  const userId = user.id;

  try {
    const [{ data: admin, error: adminErr }, { data: shopAdmin, error: shopErr }, { data: rider, error: riderErr }] =
      await Promise.all([
        supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
        supabase.from("shop_admins").select("shop_id").eq("user_id", userId).maybeSingle(),
        supabase.from("riders").select("user_id").eq("user_id", userId).maybeSingle(),
      ]);

    const networkFail =
      (adminErr && /network|fetch|failed|offline/i.test(adminErr.message || "")) ||
      (shopErr && /network|fetch|failed|offline/i.test(shopErr.message || "")) ||
      (riderErr && /network|fetch|failed|offline/i.test(riderErr.message || ""));

    if (networkFail) {
      const cached = await readRoleCache();
      if (cached && "userId" in cached && cached.userId === userId) return cached;
      return { type: "customer", userId };
    }

    let role: UserRole = { type: "customer", userId };
    if (admin) role = { type: "super_admin", userId };
    else if (shopAdmin?.shop_id) role = { type: "shop_admin", userId, shopId: shopAdmin.shop_id };
    else if (rider) role = { type: "rider", userId };
    await saveRoleCache(role);
    return role;
  } catch {
    const cached = await readRoleCache();
    if (cached && "userId" in cached && cached.userId === userId) return cached;
    return { type: "customer", userId };
  }
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
      router.replace(redirectTo as any);
    }
  }, [loaded, role.type]);

  return { role, loaded, allowed: loaded && allowed.includes(role.type) };
}
