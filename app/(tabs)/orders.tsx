import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { StatusPill, PaymentPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  shop_id: string;
  status: string;
  payment_status: string | null;
  total: number;
  shop_name?: string;
};

type Filter = "all" | "unpaid" | "paid" | "processing" | "delivered";

export default function OrdersScreen() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          setOrders([]);
          return;
        }
        const { data } = await supabase
          .from("orders")
          .select("id, shop_id, status, payment_status, total")
          .eq("customer_id", auth.user.id)
          .order("created_at", { ascending: false });
        const rows = (data as any[]) ?? [];
        const shopIds = [...new Set(rows.map((r) => r.shop_id))];
        let names: Record<string, string> = {};
        if (shopIds.length) {
          const { data: shops } = await supabase.from("shops").select("id, name").in("id", shopIds);
          (shops ?? []).forEach((s: any) => {
            names[s.id] = s.name;
          });
        }
        setOrders(rows.map((r) => ({ ...r, shop_name: names[r.shop_id] })));
      })();
    }, [])
  );

  const counts = useMemo(() => {
    const c = { all: orders.length, unpaid: 0, paid: 0, processing: 0, delivered: 0 };
    for (const o of orders) {
      const pay = (o.payment_status || "pending").toLowerCase();
      if (pay === "paid") c.paid += 1;
      else c.unpaid += 1;
      if (o.status === "delivered") c.delivered += 1;
      else if (o.status === "processing" || o.status === "preparing" || o.status === "out_for_delivery" || o.status === "new") {
        c.processing += 1;
      }
    }
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const pay = (o.payment_status || "pending").toLowerCase();
      if (filter === "unpaid") return pay !== "paid";
      if (filter === "paid") return pay === "paid";
      if (filter === "delivered") return o.status === "delivered";
      if (filter === "processing") {
        return o.status !== "delivered";
      }
      return true;
    });
  }, [orders, filter]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: `All (${counts.all})` },
    { id: "unpaid", label: `Unpaid (${counts.unpaid})` },
    { id: "paid", label: `Paid (${counts.paid})` },
    { id: "processing", label: `Processing (${counts.processing})` },
    { id: "delivered", label: `Delivered (${counts.delivered})` },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        horizontal
        data={tabs}
        keyExtractor={(t) => t.id}
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}
        renderItem={({ item }) => {
          const on = filter === item.id;
          return (
            <Pressable onPress={() => setFilter(item.id)} style={[styles.tab, on && styles.tabOn]}>
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{item.label}</Text>
            </Pressable>
          );
        }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState title="No orders" subtitle="Orders you place will show here." />}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, shadow.card]} onPress={() => router.push(`/track/${item.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderId}>
                #{item.id.slice(0, 8)} · {item.shop_name || "Shop"}
              </Text>
              <Text style={styles.orderSub}>
                K {Number(item.total).toLocaleString("en-ZM", { maximumFractionDigits: 0 })}
              </Text>
              <View style={styles.pills}>
                <PaymentPill status={item.payment_status} />
                <StatusPill status={item.status} />
              </View>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: {
    fontSize: typography.h1,
    fontFamily: typography.displayFont,
    color: colors.text,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tabs: { maxHeight: 48, marginBottom: 8 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: typography.tiny, fontFamily: typography.bodySemibold, color: colors.textMuted },
  tabTextOn: { color: "#fff" },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderId: { fontSize: typography.body, fontFamily: typography.bodyBold, color: colors.text, marginBottom: 3 },
  orderSub: { fontSize: typography.small, color: colors.textMuted, marginBottom: 8 },
  pills: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chev: { fontSize: 22, color: colors.textFaint, marginLeft: 8 },
});
