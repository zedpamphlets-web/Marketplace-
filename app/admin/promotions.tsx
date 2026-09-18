import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";

type Product = { id: string; name: string; price: number; is_deal: boolean; shops?: { name: string } | null };

export default function AdminPromotions() {
  const [items, setItems] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, is_deal, shops(name)")
      .order("name");
    if (error) setMessage(error.message);
    setItems((data as any) ?? []);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (p: Product) => {
    const { error } = await supabase.from("products").update({ is_deal: !p.is_deal }).eq("id", p.id);
    if (error) setMessage(error.message);
    load();
  };

  return (
    <AdminShell title="Promotions">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.hint}>Tap a product to mark or unmark it as a promotion / deal.</Text>
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        {items.length === 0 ? (
          <EmptyState title="No products" subtitle="Add products first." />
        ) : (
          items.map((p) => (
            <Pressable key={p.id} onPress={() => toggle(p)} style={[styles.row, shadow.card]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.sub}>
                  {kwacha(p.price)} · {p.shops?.name ?? "Shop"}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: p.is_deal ? colors.statusDoneBg : colors.bg }]}>
                <Text style={{ color: p.is_deal ? colors.statusDoneText : colors.textMuted, fontFamily: typography.bodyBold, fontSize: 11 }}>
                  {p.is_deal ? "ON SALE" : "OFF"}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  hint: { color: colors.textMuted, marginBottom: spacing.md },
  msg: { color: colors.danger, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  name: { fontFamily: typography.bodyBold, color: colors.text },
  sub: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
});
