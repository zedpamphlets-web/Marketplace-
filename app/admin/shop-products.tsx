import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  shop_id: string;
  shops?: { name: string } | null;
};

export default function ShopProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("id, name, price, stock, shop_id, shops(name)").order("created_at", { ascending: false });
    setItems((data as any) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shops = Array.from(new Set(items.map((p) => p.shops?.name).filter(Boolean))) as string[];
  const shown = filter === "all" ? items : items.filter((p) => p.shops?.name === filter);

  return (
    <AdminShell title="Products from Shops">
      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable onPress={() => setFilter("all")} style={[styles.chip, filter === "all" && styles.chipOn]}>
            <Text style={[styles.chipText, filter === "all" && styles.chipTextOn]}>All</Text>
          </Pressable>
          {shops.map((name) => (
            <Pressable key={name} onPress={() => setFilter(name)} style={[styles.chip, filter === name && styles.chipOn]}>
              <Text style={[styles.chipText, filter === name && styles.chipTextOn]}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {shown.length === 0 ? (
          <EmptyState title="No products" subtitle="Shops have not added products yet." />
        ) : (
          shown.map((p) => (
            <View key={p.id} style={[styles.row, shadow.card]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.sub}>
                  {p.shops?.name ?? "Shop"} · stock {p.stock}
                </Text>
              </View>
              <Text style={styles.price}>{kwacha(p.price)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  chips: { gap: 8, paddingBottom: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: typography.small },
  chipTextOn: { color: "#fff" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  name: { fontFamily: typography.bodyBold, color: colors.text },
  sub: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 2 },
  price: { fontFamily: typography.bodyBold, color: colors.text },
});
