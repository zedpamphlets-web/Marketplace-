import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState, PrimaryButton } from "@/components/Shared";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";

export default function ShopPrices() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : "";
  const [items, setItems] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!shopId) return;
    const { data } = await supabase.from("products").select("id, name, price").eq("shop_id", shopId).order("name");
    const rows = data ?? [];
    setItems(rows);
    const map: Record<string, string> = {};
    rows.forEach((p) => {
      map[p.id] = String(p.price);
    });
    setPrices(map);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const p of items) {
        const next = Number(prices[p.id] ?? p.price);
        if (Number.isNaN(next)) continue;
        const { error } = await supabase.from("products").update({ price: next }).eq("id", p.id);
        if (error) throw error;
      }
      setMessage("Prices saved.");
      load();
    } catch (e: any) {
      setMessage(e.message || "Could not save prices.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Shop Prices">
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <EmptyState title="No products" subtitle="Add products first." />
        ) : (
          items.map((p) => (
            <View key={p.id} style={[styles.row, shadow.card]}>
              <Text style={styles.name}>{p.name}</Text>
              <TextInput
                style={styles.input}
                value={prices[p.id] ?? ""}
                onChangeText={(t) => setPrices((prev) => ({ ...prev, [p.id]: t }))}
                keyboardType="decimal-pad"
              />
            </View>
          ))
        )}
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        {items.length > 0 ? <PrimaryButton label="Save all prices" onPress={saveAll} loading={saving} /> : null}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  row: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  name: { fontFamily: typography.bodySemibold, marginBottom: 6, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
  },
  msg: { color: colors.primary, marginVertical: spacing.md },
});
