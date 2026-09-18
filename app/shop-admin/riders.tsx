import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from "react-native";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";

type RiderRow = {
  id: string;
  shop_id: string;
  name?: string | null;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string;
};

function toWhatsAppUrl(phone: string) {
  // Keep digits only. If number looks local (starts with 0), swap to Zambia code 260.
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "260" + digits.slice(1);
  }
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export default function ShopRidersScreen() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : null;
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!shopId) return;
    const { data, error: err } = await supabase
      .from("riders")
      .select("id, shop_id, name, phone, is_active, created_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (!err) setRiders((data as RiderRow[]) ?? []);
    setRefreshing(false);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const addRider = async () => {
    setError("");
    setMessage("");
    if (!shopId) return;
    if (!name.trim()) {
      setError("Enter the rider name.");
      return;
    }
    if (!phone.trim()) {
      setError("Enter the phone number.");
      return;
    }
    setLoading(true);
    try {
      const { error: insertErr } = await supabase.from("riders").insert({
        shop_id: shopId,
        name: name.trim(),
        phone: phone.trim(),
        is_active: true,
      });
      if (insertErr) throw insertErr;

      setMessage("Rider added.");
      setName("");
      setPhone("");
      await load();
    } catch (e: any) {
      setError(e.message || "Could not add rider.");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = async (rawPhone: string) => {
    const url = toWhatsAppUrl(rawPhone);
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      setError("Could not open WhatsApp.");
    }
  };

  const removeRider = async (id: string) => {
    await supabase.from("riders").delete().eq("id", id);
    await load();
  };

  return (
    <AdminShell title="Riders">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <Text style={styles.section}>Add rider</Text>
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Rider name"
            placeholderTextColor={colors.textFaint}
          />
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="097..."
            placeholderTextColor={colors.textFaint}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.ok}>{message}</Text> : null}
          <Pressable style={styles.btn} onPress={addRider} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Add rider</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.section}>Your riders</Text>
        {riders.length === 0 ? (
          <Text style={styles.empty}>No riders yet. Add name and phone above.</Text>
        ) : (
          riders.map((r) => (
            <View key={r.id} style={[styles.row, shadow.card]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{r.name || "Rider"}</Text>
                {r.phone ? (
                  <Pressable onPress={() => openWhatsApp(r.phone!)} hitSlop={6}>
                    <Text style={styles.phoneLink}>{r.phone} · WhatsApp</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.rowSub}>No phone</Text>
                )}
              </View>
              <View style={styles.actions}>
                {r.phone ? (
                  <Pressable style={styles.waBtn} onPress={() => openWhatsApp(r.phone!)}>
                    <Text style={styles.waBtnText}>Chat</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.removeBtn} onPress={() => removeRider(r.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  section: {
    fontFamily: typography.bodyBold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.bodySemibold,
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  btn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontFamily: typography.bodySemibold,
  },
  error: { color: colors.danger, marginTop: 8 },
  ok: { color: colors.success, marginTop: 8 },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  rowName: { fontFamily: typography.bodyBold, color: colors.text },
  rowSub: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 2 },
  phoneLink: {
    color: colors.primary,
    fontSize: typography.small,
    fontFamily: typography.bodySemibold,
    marginTop: 2,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  waBtn: {
    backgroundColor: "#25D366",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  waBtnText: {
    color: "#fff",
    fontFamily: typography.bodySemibold,
    fontSize: typography.tiny,
  },
  removeBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  removeText: {
    color: colors.danger,
    fontFamily: typography.bodySemibold,
    fontSize: typography.tiny,
  },
});
