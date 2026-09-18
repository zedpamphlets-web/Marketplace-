import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";

export default function ShopRevenue() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : "";
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!shopId) return;
    const { data } = await supabase.from("orders").select("id, total, status, created_at").eq("shop_id", shopId).order("created_at", { ascending: false });
    setOrders(data ?? []);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <AdminShell title="Total Revenue">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.label}>SHOP REVENUE</Text>
          <Text style={styles.total}>{kwacha(total)}</Text>
        </View>
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" />
        ) : (
          orders.map((o) => (
            <View key={o.id} style={[styles.row, shadow.card]}>
              <Text style={styles.name}>#{String(o.id).slice(0, 8)} · {o.status}</Text>
              <Text style={styles.amt}>{kwacha(o.total)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg },
  label: { color: colors.textFaint, fontFamily: typography.bodySemibold, fontSize: 11 },
  total: { fontSize: 28, fontFamily: typography.displayFont, marginTop: 6, color: colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  name: { color: colors.text, fontFamily: typography.bodyMedium },
  amt: { fontFamily: typography.bodyBold, color: colors.text },
});
