import React, { useEffect, useState } from "react";
import { Text, StyleSheet, ScrollView, TextInput, Switch, View } from "react-native";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton } from "@/components/Shared";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";

export default function EditOwnShop() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : "";
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const { data } = await supabase.from("shops").select("name, category, is_open").eq("id", shopId).maybeSingle();
      if (data) {
        setName(data.name ?? "");
        setCategory(data.category ?? "");
        setIsOpen(!!data.is_open);
      }
    })();
  }, [shopId]);

  const save = async () => {
    if (!shopId) return;
    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({ name: name.trim(), category: category.trim() || null, is_open: isOpen, setup_complete: true })
      .eq("id", shopId);
    setSaving(false);
    setMessage(error ? error.message : "Shop updated.");
  };

  return (
    <AdminShell title="Edit Shop">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Shop name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Open for orders</Text>
          <Switch value={isOpen} onValueChange={setIsOpen} />
        </View>
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Save shop" onPress={save} loading={saving} />
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
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
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: spacing.md },
  msg: { color: colors.primary, marginBottom: spacing.md },
});
