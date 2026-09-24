import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect, Ellipse } from "react-native-svg";
import { Image } from "expo-image";
import { colors, typography } from "@/lib/theme";
import { useSupportEmail } from "@/lib/appSettings";
import { signInWithProvider } from "@/lib/authFlow";

export default function AuthLanding() {
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState("");
  const supportEmail = useSupportEmail();

  const social = async (provider: "google" | "apple") => {
    setError("");
    setBusy(provider);
    try {
      const dest = await signInWithProvider(provider);
      router.replace(dest as any);
    } catch (e: any) {
      if (e?.message !== "Sign in cancelled.") {
        setError(e.message || "Turn on this provider in Supabase Auth.");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.heroTop}>
            <Text style={styles.brand}>ShopTrory</Text>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.kicker}>Shop with</Text>
          <Text style={styles.heroTitle}>fast delivery</Text>
          <Text style={styles.heroTitle}>& trusted shops</Text>
        </SafeAreaView>
        <View style={styles.artWrap}>
          <Image source={require("../../assets/delivery-hero.png")} style={styles.heroImage} contentFit="contain" />
        </View>
      </View>

      <View style={styles.sheet}>
        <Pressable style={styles.pill} onPress={() => social("google")} disabled={!!busy}>
          {busy === "google" ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Text style={styles.gLetter}>G</Text>
              <Text style={styles.pillText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.pill} onPress={() => social("apple")} disabled={!!busy}>
          {busy === "apple" ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.text}>
                <Path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-0.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c1.1-1.4 1.5-2.8 1.5-2.9-.1 0-2.8-1.1-2.8-4.5zM14.3 6.2c.6-.8 1.1-1.9.9-3-0.9.1-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
              </Svg>
              <Text style={styles.pillText}>Continue with Apple</Text>
            </>
          )}
        </Pressable>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <Pressable style={styles.pill} onPress={() => router.push("/auth/email")}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
            <Rect x="3" y="5" width="18" height="14" rx="2" />
            <Path d="M3 7l9 7 9-7" />
          </Svg>
          <Text style={styles.pillText}>Continue with email</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {supportEmail ? (
          <>
            <Text style={styles.help}>Need help? Email us</Text>
            <Text style={styles.email}>{supportEmail}</Text>
          </>
        ) : null}
      </View>

      <Modal visible={!!busy} transparent animationType="fade">
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Loading...</Text>
            <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
            <Text style={styles.modalSub}>Please wait...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  hero: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingBottom: 8 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: colors.onPrimary, fontSize: 22, fontFamily: typography.displayFont },
  close: { color: colors.onPrimary, fontSize: 22 },
  kicker: { color: "rgba(17,17,17,0.72)", marginTop: 28, textAlign: "center", fontSize: 14 },
  heroTitle: {
    color: colors.onPrimary,
    fontSize: 26,
    fontFamily: typography.displayFont,
    textAlign: "center",
    lineHeight: 32,
  },
  artWrap: { alignItems: "center", marginTop: 18 },
  sheet: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 28,
    paddingVertical: 14,
    marginBottom: 12,
  },
  pillText: { fontSize: 16, fontFamily: typography.bodySemibold, color: colors.text },
  gLetter: { fontFamily: typography.bodyBold, fontSize: 18, color: "#4285F4" },
  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 8, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  orText: { color: colors.textFaint, fontSize: 12 },
  error: { color: colors.danger, textAlign: "center", marginTop: 10 },
  help: { textAlign: "center", color: colors.textMuted, marginTop: 18 },
  email: { textAlign: "center", color: colors.primary, fontFamily: typography.bodySemibold, marginTop: 4 },
  modalBack: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 22, minWidth: 220, alignItems: "center" },
  modalTitle: { fontFamily: typography.bodySemibold, fontSize: 16, color: colors.text },
  modalSub: { marginTop: 8, color: colors.textMuted },
});
