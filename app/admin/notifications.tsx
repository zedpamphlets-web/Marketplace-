import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { StatusPill, PaymentPill } from "@/components/StatusPill";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";

type OrderRow = {
  id: string;
  total: number;
  status: string;
  payment_status: string | null;
  created_at: string;
  shops?: { name?: string } | null;
};

export default function AdminNotifications() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, total, status, payment_status, created_at, shops(name)")
      .order("created_at", { ascending: false })
      .limit(40);
    setOrders((data as OrderRow[]) ?? []);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <AdminShell title="Notifications">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <Text style={styles.intro}>Recent order activity</Text>
        {orders.length === 0 ? (
          <EmptyState title="No recent activity" subtitle="New orders will show up here." />
        ) : (
          orders.map((o) => (
            <Pressable
              key={o.id}
              style={[styles.card, shadow.card]}
              onPress={() => router.push("/admin/orders" as any)}
            >
              <View style={styles.rowTop}>
                <Text style={styles.shop} numberOfLines={1}>
                  {o.shops?.name ?? "Order"}
                </Text>
                <Text style={styles.amount}>{kwacha(o.total)}</Text>
              </View>
              <View style={styles.pills}>
                <StatusPill status={o.status || "new"} />
                <PaymentPill status={o.payment_status} />
              </View>
              <Text style={styles.time}>{new Date(o.created_at).toLocaleString()}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  intro: {
    fontFamily: typography.bodyMedium,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontSize: typography.small,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  shop: { flex: 1, fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.body, marginRight: 8 },
  amount: { fontFamily: typography.bodyBold, color: colors.primary, fontSize: typography.body },
  pills: { flexDirection: "row", gap: 8, marginBottom: 6 },
  time: { fontSize: typography.tiny, color: colors.textMuted },
});
