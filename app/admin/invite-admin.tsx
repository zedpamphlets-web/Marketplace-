import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton, EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";

type Shop = { id: string; name: string };
type Invite = { id: string; email: string; accepted: boolean; shop_id: string; shops?: { name: string } | null };

export default function InviteAdmin() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [shopId, setShopId] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [{ data: shopRows }, { data: inviteRows }] = await Promise.all([
      supabase.from("shops").select("id, name").order("name"),
      supabase.from("shop_invites").select("id, email, accepted, shop_id, shops(name)").order("created_at", { ascending: false }),
    ]);
    setShops((shopRows as Shop[]) ?? []);
    setInvites((inviteRows as any) ?? []);
    if (!shopId && shopRows && shopRows.length) setShopId(shopRows[0].id);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async () => {
    setMessage("");
    if (!email.trim() || !shopId) {
      setMessage("Choose a shop and enter an email.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("shop_invites").insert({
      shop_id: shopId,
      email: email.trim().toLowerCase(),
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setEmail("");
    setMessage("Invite saved. They must sign up / log in with this email.");
    load();
  };

  return (
    <AdminShell title="Invite Admin">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Shop</Text>
        <View style={styles.chipRow}>
          {shops.map((s) => (
            <Pressable key={s.id} onPress={() => setShopId(s.id)} style={[styles.chip, shopId === s.id && styles.chipOn]}>
              <Text style={[styles.chipText, shopId === s.id && styles.chipTextOn]}>{s.name || "Untitled"}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Admin email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="owner@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Send invite" onPress={invite} loading={saving} disabled={!shopId} />

        <Text style={[styles.label, { marginTop: spacing.xl }]}>Pending / accepted</Text>
        {invites.length === 0 ? (
          <EmptyState title="No invites yet" />
        ) : (
          invites.map((inv) => (
            <View key={inv.id} style={styles.row}>
              <Text style={styles.email}>{inv.email}</Text>
              <Text style={styles.meta}>
                {inv.shops?.name ?? "Shop"} · {inv.accepted ? "Accepted" : "Waiting"}
              </Text>
            </View>
          ))
        )}
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
    marginBottom: spacing.md,
    color: colors.text,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: typography.small },
  chipTextOn: { color: "#fff" },
  msg: { color: colors.primary, marginBottom: spacing.sm },
  row: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  email: { fontFamily: typography.bodyBold, color: colors.text },
  meta: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 2 },
});
