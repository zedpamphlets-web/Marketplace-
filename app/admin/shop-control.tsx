import React, { useEffect, useState } from "react";
import { Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton } from "@/components/Shared";
import { supabase } from "@/lib/supabase";

export default function ShopControl() {
  const [localFee, setLocalFee] = useState("50");
  const [outsideFee, setOutsideFee] = useState("100");
  const [multi, setMulti] = useState("5");
  const [commission, setCommission] = useState("0");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("settings").select("*").eq("id", "global").maybeSingle();
      if (!data) return;
      setLocalFee(String(data.delivery_fee_local ?? 50));
      setOutsideFee(String(data.delivery_fee_outside ?? 100));
      setMulti(String(data.multi_item_fee_percent ?? 5));
      setCommission(String(data.commission_percent ?? 0));
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("settings")
      .update({
        delivery_fee_local: Number(localFee || 0),
        delivery_fee_outside: Number(outsideFee || 0),
        multi_item_fee_percent: Number(multi || 0),
        commission_percent: Number(commission || 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", "global");
    setSaving(false);
    setMessage(error ? error.message : "Shop control saved.");
  };

  return (
    <AdminShell title="Shop Control">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Local delivery fee (K)</Text>
        <TextInput style={styles.input} value={localFee} onChangeText={setLocalFee} keyboardType="decimal-pad" />
        <Text style={styles.label}>Outside-province delivery fee (K)</Text>
        <TextInput style={styles.input} value={outsideFee} onChangeText={setOutsideFee} keyboardType="decimal-pad" />
        <Text style={styles.label}>Multi-item extra %</Text>
        <TextInput style={styles.input} value={multi} onChangeText={setMulti} keyboardType="decimal-pad" />
        <Text style={styles.label}>Platform commission %</Text>
        <TextInput style={styles.input} value={commission} onChangeText={setCommission} keyboardType="decimal-pad" />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Save settings" onPress={save} loading={saving} />
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
  msg: { color: colors.primary, marginVertical: spacing.md },
});
