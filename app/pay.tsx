import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { colors, typography } from "@/lib/theme";
import { PrimaryButton } from "@/components/Shared";
import { startLipilaPayment, verifyLipilaPayment, nextPollDelay, MAX_POLL_ATTEMPTS } from "@/lib/payments";
import type { LipilaProvider } from "@/lib/lipila";

type Phase = "sending" | "waiting" | "timeout" | "paid" | "failed";

const labels: Record<string, string> = {
  mtn: "MTN MoMo",
  airtel: "Airtel Money",
  zamtel: "Zamtel Kwacha",
};

export default function PayScreen() {
  const params = useLocalSearchParams<{ orderId?: string; provider?: string; phone?: string }>();
  const orderId = String(params.orderId || "");
  const provider = (params.provider || "mtn") as LipilaProvider;
  const phone = String(params.phone || "");
  const [phase, setPhase] = useState<Phase>("sending");
  const [reason, setReason] = useState("");
  const stop = useRef(false);

  const poll = async (attempt = 0) => {
    if (stop.current) return;
    const result = await verifyLipilaPayment(orderId);
    if (result.status === "paid") {
      setPhase("paid");
      return;
    }
    if (result.status === "failed") {
      setReason(result.reason || "Please try again.");
      setPhase("failed");
      return;
    }
    if (attempt >= MAX_POLL_ATTEMPTS) {
      setPhase("timeout");
      return;
    }
    setTimeout(() => poll(attempt + 1), nextPollDelay(attempt));
  };

  const start = async () => {
    setPhase("sending");
    setReason("");
    stop.current = false;
    try {
      await startLipilaPayment({ provider, orderId, phone });
      setPhase("waiting");
      poll();
    } catch (e: any) {
      setReason(e.message || "Could not start payment.");
      setPhase("failed");
    }
  };

  useEffect(() => {
    start();
    return () => {
      stop.current = true;
    };
  }, [orderId]);

  const name = labels[provider] || "Mobile money";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.box}>
        {phase === "sending" || phase === "waiting" ? (
          <>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.title}>Waiting for confirmation</Text>
            <Text style={styles.copy}>
              Approve the {name} prompt on {phone}. This can take up to 2 minutes.
            </Text>
          </>
        ) : null}

        {phase === "timeout" ? (
          <>
            <Text style={styles.title}>Still waiting on the network</Text>
            <Text style={styles.copy}>
              {name} is taking longer than usual. Your order is saved — if you already approved it, it will go through shortly.
            </Text>
            <PrimaryButton
              label="Check again"
              onPress={() => {
                setPhase("waiting");
                poll();
              }}
            />
            <Pressable onPress={() => router.replace("/(tabs)/orders")} style={styles.linkWrap}>
              <Text style={styles.link}>Check order later</Text>
            </Pressable>
          </>
        ) : null}

        {phase === "paid" ? (
          <>
            <Text style={styles.title}>Payment successful</Text>
            <Text style={styles.copy}>Your order has been placed.</Text>
            <PrimaryButton label="Track order" onPress={() => router.replace("/(tabs)/orders")} />
            <Pressable onPress={() => router.replace("/(tabs)")} style={styles.linkWrap}>
              <Text style={styles.link}>Back home</Text>
            </Pressable>
          </>
        ) : null}

        {phase === "failed" ? (
          <>
            <Text style={styles.title}>Payment failed</Text>
            <Text style={styles.copy}>{reason || "Please try again."}</Text>
            <PrimaryButton label="Try again" onPress={start} />
            <Pressable onPress={() => router.replace("/(tabs)/orders")} style={styles.linkWrap}>
              <Text style={styles.link}>View order</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  box: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 14 },
  title: { fontFamily: typography.displaySemibold, fontSize: 22, textAlign: "center", color: colors.text },
  copy: { textAlign: "center", color: colors.textMuted, lineHeight: 20, marginBottom: 8 },
  linkWrap: { paddingVertical: 8 },
  link: { color: colors.primary, fontFamily: typography.bodySemibold },
});
