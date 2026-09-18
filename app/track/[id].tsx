import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { PaymentPill, StatusPill } from "@/components/StatusPill";
import { supabase } from "@/lib/supabase";

const STEPS: { key: string; label: string }[] = [
  { key: "new", label: "Order placed" },
  { key: "processing", label: "Processing" },
  { key: "preparing", label: "Processing" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

function statusIndex(status: string) {
  if (status === "delivered") return 3;
  if (status === "out_for_delivery") return 2;
  if (status === "processing" || status === "preparing") return 1;
  return 0;
}

const DISPLAY_STEPS = [
  { label: "Order placed" },
  { label: "Processing" },
  { label: "Out for delivery" },
  { label: "Delivered" },
];

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const { data } = await supabase
          .from("orders")
          .select("id, total, status, payment_status, shop_id, delivery_address, shops(name)")
          .eq("id", String(id))
          .maybeSingle();
        setOrder(data);
        setLoading(false);
      })();
    }, [id])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.orderTag}>Order</Text>
        </View>
        <Text style={styles.empty}>Order not found</Text>
      </SafeAreaView>
    );
  }

  const currentIndex = statusIndex(order.status || "new");
  const shopName = order.shops?.name || "Shop";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.orderTag}>Order #{String(order.id).slice(0, 8)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.shopName}>{shopName}</Text>
          <Text style={styles.orderMeta}>
            K {Number(order.total || 0).toLocaleString("en-ZM", { maximumFractionDigits: 0 })}
          </Text>
          <View style={styles.pills}>
            <PaymentPill status={order.payment_status} />
            <StatusPill status={order.status} />
          </View>

          <View style={styles.stepsWrap}>
            {DISPLAY_STEPS.map((step, i) => {
              const done = i <= currentIndex;
              const isLast = i === DISPLAY_STEPS.length - 1;
              return (
                <View key={step.label} style={styles.stepRow}>
                  <View style={styles.stepIndicator}>
                    <View style={[styles.stepDot, { backgroundColor: done ? colors.success : colors.border }]} />
                    {!isLast && (
                      <View style={[styles.stepLine, { backgroundColor: done ? colors.success : colors.border }]} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                    <Text style={[styles.stepLabel, { color: done ? colors.text : colors.textFaint }]}>
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 20, color: colors.text },
  orderTag: { fontSize: typography.body, fontFamily: typography.bodySemibold, color: colors.text },
  content: { padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  shopName: {
    fontSize: typography.h2,
    fontFamily: typography.displaySemibold,
    color: colors.text,
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  pills: { flexDirection: "row", gap: 8, marginBottom: spacing.xl },
  stepsWrap: { marginTop: spacing.sm },
  stepRow: { flexDirection: "row" },
  stepIndicator: { alignItems: "center", width: 24 },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLine: { width: 2, flex: 1, marginTop: 4 },
  stepLabel: {
    fontSize: typography.body,
    fontFamily: typography.bodySemibold,
    marginLeft: spacing.md,
    marginTop: -2,
  },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
