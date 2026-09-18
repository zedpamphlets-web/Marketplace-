import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";

export default function AdminRevenue() {
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("orders").select("id, total, status, created_at, shops(name)").order("created_at", { ascending: false });
    setOrders(data ?? []);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <AdminShell title="Total Revenue">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={[styles.totalCard, shadow.card]}>
          <Text style={styles.label}>ALL-TIME REVENUE</Text>
          <Text style={styles.total}>{kwacha(total)}</Text>
          <Text style={styles.sub}>{orders.length} orders</Text>
        </View>

        {orders.length === 0 ? (
          <EmptyState title="No orders yet" />
        ) : (
          orders.map((o) => (
            <View key={o.id} style={[styles.row, shadow.card]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{o.shops?.name ?? "Shop"}</Text>
                <Text style={styles.sub}>{o.status} · {new Date(o.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.amount}>{kwacha(o.total)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  totalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  label: { color: colors.textFaint, fontFamily: typography.bodySemibold, fontSize: 11 },
  total: { fontSize: 28, fontFamily: typography.displayFont, color: colors.text, marginTop: 6 },
  sub: { color: colors.textMuted, marginTop: 4, fontSize: typography.tiny },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  name: { fontFamily: typography.bodyBold, color: colors.text },
  amount: { fontFamily: typography.bodyBold, color: colors.text },
});
