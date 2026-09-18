import React, { useEffect, useState } from "react";
import { Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton } from "@/components/Shared";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";

export default function ShopControl() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : "";
  const [fee, setFee] = useState("12");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const { data } = await supabase.from("shops").select("delivery_fee").eq("id", shopId).maybeSingle();
      if (data) setFee(String(data.delivery_fee ?? 12));
    })();
  }, [shopId]);

  const save = async () => {
    if (!shopId) return;
    setSaving(true);
    const { error } = await supabase.from("shops").update({ delivery_fee: Number(fee || 0) }).eq("id", shopId);
    setSaving(false);
    setMessage(error ? error.message : "Delivery fee saved.");
  };

  return (
    <AdminShell title="Shop Control">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Delivery fee (K)</Text>
        <TextInput style={styles.input} value={fee} onChangeText={setFee} keyboardType="decimal-pad" />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Save" onPress={save} loading={saving} />
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
    marginBottom: spacing.md,
  },
  msg: { color: colors.primary, marginBottom: spacing.md },
});
