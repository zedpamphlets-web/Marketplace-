/**
 * Page 2 — Payment method + Pay.
 * Creates grouped order, starts Lipila collection, shows full-screen
 * confirming view for ≥10s while polling, then success/failure result.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { readCart, writeCart, type CartLine } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { LIPILA_PROVIDERS, type LipilaProvider } from "@/lib/lipila";
import { startLipilaPayment, verifyLipilaPayment } from "@/lib/payments";

type Phase = "form" | "confirming" | "success" | "failed";

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    groupId?: string;
    orderId?: string;
    provider?: string;
    phone?: string;
    province?: string;
    district?: string;
    area?: string;
    location?: string;
  }>();

  const deliveryPhone = String(params.phone || "");
  const location = String(params.location || "");
  const fullNameFromLoc = ""; // name collected only if we add later; use location string

  const [lines, setLines] = useState<CartLine[]>([]);
  const [provider, setProvider] = useState<LipilaProvider | null>(
    (params.provider as LipilaProvider) || null
  );
  const [mmPhone, setMmPhone] = useState(deliveryPhone);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [groupId, setGroupId] = useState(String(params.groupId || params.orderId || ""));
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minWaitDone = useRef(false);

  useEffect(() => {
    readCart().then(setLines);
  }, []);

  // Block back while confirming
  useEffect(() => {
    if (phase !== "confirming") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [phase]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = useCallback((gid: string) => {
    minWaitDone.current = false;
    setTimeout(() => {
      minWaitDone.current = true;
    }, 10000);

    const tick = async () => {
      const result = await verifyLipilaPayment(gid);
      if (result.status === "paid") {
        if (pollRef.current) clearInterval(pollRef.current);
        const finish = () => setPhase("success");
        if (minWaitDone.current) finish();
        else setTimeout(finish, 10000);
      } else if (result.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
        const finish = () => setPhase("failed");
        if (minWaitDone.current) finish();
        else setTimeout(finish, 10000);
      }
    };

    tick();
    pollRef.current = setInterval(tick, 3000);
  }, []);

  const handlePay = async () => {
    setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push("/auth/login");
      return;
    }
    if (!lines.length) {
      setMessage("Your cart is empty.");
      return;
    }
    if (!provider) {
      setMessage("Choose Airtel Money, MTN MoMo, or Zamtel Kwacha.");
      return;
    }
    if (!mmPhone.trim()) {
      setMessage("Enter the mobile money number to charge.");
      return;
    }
    if (!location) {
      setMessage("Missing delivery details. Go back and verify them.");
      return;
    }

    setPhase("confirming");
    try {
      const items = lines.map((l) => ({
        shop_id: l.shop_id,
        product_id: l.id,
        qty: l.qty,
      }));
      if (items.some((i) => !i.shop_id)) {
        throw new Error("Cart items are missing a shop.");
      }

      const locWithNote = comment.trim()
        ? `${location}${location ? " · " : ""}${comment.trim()}`
        : location;

      // Delivery fields come from checkout route params (not a delivery object).
      const customerPhone = deliveryPhone || mmPhone.trim();
      const customerName = customerPhone; // no separate name field on checkout yet

      const { data, error } = await supabase
        .rpc("create_grouped_order", {
          p_items: items,
          p_full_name: customerName,
          p_phone: customerPhone,
          p_location: locWithNote,
          p_payment_method: provider,
        })
        .single();
      if (error) {
        throw new Error(`Create order failed: ${error.message}`);
      }
      const newGroupId = (data as any)?.group_id as string;
      if (!newGroupId) throw new Error("Could not create order group (no group_id returned).");
      setGroupId(newGroupId);

      try {
        await startLipilaPayment({
          provider,
          groupId: newGroupId,
          phone: mmPhone.trim(),
        });
      } catch (payErr: any) {
        throw new Error(`Payment server: ${payErr?.message || "failed"}`);
      }

      startPolling(newGroupId);
    } catch (e: any) {
      setPhase("failed");
      setMessage(e?.message || "Payment could not start.");
    }
  };

  if (phase === "confirming") {
    return (
      <SafeAreaView style={styles.fullScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.confirmTitle}>Confirming your payment…</Text>
        <Text style={styles.confirmBody}>
          Please do not exit or close the app. Approve the payment on your phone if prompted.
        </Text>
      </SafeAreaView>
    );
  }

  if (phase === "success") {
    return (
      <SafeAreaView style={styles.fullScreen}>
        <View style={styles.resultCircleOk}>
          <Text style={styles.resultIcon}>✓</Text>
        </View>
        <Text style={styles.resultTitle}>Payment successful</Text>
        <Text style={styles.resultBody}>Your order is paid. Shops will start preparing it.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/(tabs)/orders")}>
          <Text style={styles.primaryBtnText}>View orders</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.link}>Back to home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (phase === "failed") {
    return (
      <SafeAreaView style={styles.fullScreen}>
        <View style={styles.resultCircleFail}>
          <Text style={styles.resultIcon}>✕</Text>
        </View>
        <Text style={styles.resultTitle}>Payment failed</Text>
        <Text style={styles.resultBody}>{message || "The payment did not go through. You can try again."}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            setPhase("form");
            setMessage("");
          }}
        >
          <Text style={styles.primaryBtnText}>Try again</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)/cart")}>
          <Text style={styles.link}>Back to cart</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Payment</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.steps}>
        <View style={[styles.stepDot, styles.stepOn]} />
        <View style={[styles.stepLine, styles.stepLineOn]} />
        <View style={[styles.stepDot, styles.stepOn]} />
      </View>
      <Text style={styles.stepLabel}>Step 2 of 2 · Pay securely</Text>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.label}>Payment method</Text>
          <View style={styles.providerRow}>
            {LIPILA_PROVIDERS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setProvider(p.id)}
                style={[styles.providerChip, provider === p.id && styles.providerOn]}
              >
                <Text style={[styles.providerText, provider === p.id && styles.providerTextOn]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Mobile money number</Text>
          <TextInput
            style={styles.input}
            value={mmPhone}
            onChangeText={setMmPhone}
            placeholder="Number to charge"
            placeholderTextColor={colors.textFaint}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Delivery note (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={comment}
            onChangeText={setComment}
            placeholder="Landmark, gate colour, etc."
            placeholderTextColor={colors.textFaint}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {location ? (
            <Text style={styles.locPreview}>Deliver to: {location}</Text>
          ) : null}

          {message ? <Text style={styles.error}>{message}</Text> : null}

          <Pressable style={styles.payBtn} onPress={handlePay}>
            <Text style={styles.payBtnText}>Pay</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { fontSize: 32, color: colors.text, width: 28, lineHeight: 36 },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.displaySemibold,
    fontSize: typography.h3,
    color: colors.text,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.md,
  },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  stepOn: { backgroundColor: colors.primary },
  stepLine: { width: 48, height: 2, backgroundColor: colors.border },
  stepLineOn: { backgroundColor: colors.primary },
  stepLabel: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: 8,
    marginBottom: 4,
  },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontFamily: typography.bodySemibold,
    fontSize: typography.small,
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  textArea: { minHeight: 80, paddingTop: 12 },
  providerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  providerChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  providerOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  providerText: { fontSize: typography.small, color: colors.textMuted, fontFamily: typography.bodySemibold },
  providerTextOn: { color: colors.onPrimary },
  locPreview: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 12 },
  error: { color: colors.danger, marginTop: 8, fontSize: typography.small },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  payBtnText: { color: colors.onPrimary, fontFamily: typography.bodyBold, fontSize: typography.body },
  confirmTitle: {
    marginTop: spacing.lg,
    fontFamily: typography.displaySemibold,
    fontSize: typography.h3,
    color: colors.text,
    textAlign: "center",
  },
  confirmBody: {
    marginTop: 8,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  resultCircleOk: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  resultCircleFail: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  resultIcon: { fontSize: 40, color: colors.text },
  resultTitle: {
    fontFamily: typography.displaySemibold,
    fontSize: typography.h2,
    color: colors.text,
    marginBottom: 8,
  },
  resultBody: { color: colors.textMuted, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  primaryBtnText: { color: colors.onPrimary, fontFamily: typography.bodyBold },
  link: { color: colors.primary, fontFamily: typography.bodySemibold },
});
