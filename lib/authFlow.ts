import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";
import { acceptPendingShopInvite } from "./adminActions";

WebBrowser.maybeCompleteAuthSession();

export async function resolveDestination(skipOnboarding = false) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return "/(tabs)";

  await acceptPendingShopInvite();

  const { data: admin } = await supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (admin) return "/admin";

  const { data: shopAdmin } = await supabase
    .from("shop_admins")
    .select("shop_id, shops(setup_complete)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (shopAdmin) {
    // @ts-ignore
    if (shopAdmin.shops?.setup_complete === false) return "/shop-admin/setup";
    return "/shop-admin";
  }

  const { data: rider } = await supabase.from("riders").select("shop_id").eq("user_id", user.id).maybeSingle();
  if (rider) return "/rider";

  if (!skipOnboarding) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile?.onboarding_complete) return "/auth/onboarding";
  }

  return "/(tabs)";
}

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token) return null;
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

export async function signInWithProvider(provider: "google" | "apple") {
  const redirectTo = makeRedirectUri({ scheme: "marketplaceapp", path: "auth/callback" });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Could not start sign in.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) {
    throw new Error("Sign in cancelled.");
  }
  await createSessionFromUrl(result.url);
  return resolveDestination();
}
