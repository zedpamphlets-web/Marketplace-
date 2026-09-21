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
  const [whatsapp, setWhatsapp] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const { data } = await supabase
        .from("shops")
        .select("name, category, is_open, whatsapp_number")
        .eq("id", shopId)
        .maybeSingle();
      if (data) {
        setName(data.name ?? "");
        setCategory(data.category ?? "");
        setIsOpen(!!data.is_open);
        setWhatsapp((data as any).whatsapp_number ?? "");
      }
    })();
  }, [shopId]);

  const save = async () => {
    if (!shopId) return;
    setSaving(true);
    // Normalize: digits only, keep leading country code if provided
    const wa = whatsapp.replace(/[^\d+]/g, "").trim();
    const { error } = await supabase
      .from("shops")
      .update({
        name: name.trim(),
        category: category.trim() || null,
        is_open: isOpen,
        whatsapp_number: wa || null,
        setup_complete: true,
      })
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
        <Text style={styles.label}>WhatsApp number</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="e.g. 260977123456"
          placeholderTextColor={colors.textFaint}
          keyboardType="phone-pad"
        />
        <Text style={styles.hint}>
          Customers use this number when they tap Chat on your products. Include country code (260…).
        </Text>
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
  content: { padding: spacing.lg, paddingBottom: 40 },
  label: {
    fontFamily: typography.bodySemibold,
    marginBottom: 6,
    marginTop: spacing.md,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  hint: {
    color: colors.textMuted,
    fontSize: typography.tiny,
    marginTop: 4,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  msg: { color: colors.primary, marginBottom: spacing.sm, marginTop: spacing.sm },
});
