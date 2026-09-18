import React, { useCallback, useEffect, useState } from "react";
import { Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton } from "@/components/Shared";
import { supabase } from "@/lib/supabase";

type Shop = {
  id: string;
  name: string;
  category: string | null;
  delivery_fee: number;
  is_open: boolean;
  setup_complete: boolean;
};

export default function EditShop() {
  const { shopId } = useLocalSearchParams<{ shopId?: string }>();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selected, setSelected] = useState(shopId ?? "");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [fee, setFee] = useState("12");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const applyShop = (s: Shop) => {
    setSelected(s.id);
    setName(s.name);
    setCategory(s.category ?? "");
    setFee(String(s.delivery_fee ?? 12));
  };

  const load = useCallback(async () => {
    const { data } = await supabase.from("shops").select("id, name, category, delivery_fee, is_open, setup_complete").order("name");
    const rows = (data as Shop[]) ?? [];
    setShops(rows);
    const current = rows.find((s) => s.id === (shopId || selected)) || rows[0];
    if (current) applyShop(current);
  }, [shopId, selected]);

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({
        name: name.trim(),
        category: category.trim() || null,
        delivery_fee: Number(fee || 0),
        setup_complete: true,
      })
      .eq("id", selected);
    setSaving(false);
    setMessage(error ? error.message : "Shop updated.");
    load();
  };

  return (
    <AdminShell title="Edit Shop">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Choose shop</Text>
        {shops.map((s) => (
          <Pressable key={s.id} onPress={() => applyShop(s)} style={[styles.chip, selected === s.id && styles.chipOn]}>
            <Text style={[styles.chipText, selected === s.id && styles.chipTextOn]}>{s.name || "Untitled"}</Text>
          </Pressable>
        ))}

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} />
        <Text style={styles.label}>Delivery fee (K)</Text>
        <TextInput style={styles.input} value={fee} onChangeText={setFee} keyboardType="decimal-pad" />

        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Save changes" onPress={save} loading={saving} disabled={!selected} />
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  label: { fontFamily: typography.bodySemibold, marginBottom: 6, marginTop: spacing.md, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: "#ECFDF5" },
  chipText: { color: colors.text },
  chipTextOn: { color: colors.primaryDark, fontFamily: typography.bodySemibold },
  msg: { color: colors.primary, marginVertical: spacing.md },
});
