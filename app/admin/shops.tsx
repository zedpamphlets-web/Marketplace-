import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton, EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";

type Shop = {
  id: string;
  name: string;
  category: string | null;
  is_open: boolean;
  setup_complete: boolean;
  rating: number;
};

export default function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("id, name, category, is_open, setup_complete, rating")
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    setShops((data as Shop[]) ?? []);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleOpen = async (shop: Shop) => {
    const { error } = await supabase.from("shops").update({ is_open: !shop.is_open }).eq("id", shop.id);
    if (error) setMessage(error.message);
    load();
  };

  return (
    <AdminShell title="Shops">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <PrimaryButton label="Create shop + invite admin" onPress={() => router.push("/admin/create-shop")} />
        {message ? <Text style={styles.msg}>{message}</Text> : null}

        {shops.length === 0 ? (
          <EmptyState title="No shops yet" subtitle="Tap Create shop to add the first one." />
        ) : (
          shops.map((s) => (
            <View key={s.id} style={[styles.row, shadow.card]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.name || "Untitled shop"}</Text>
                <Text style={styles.sub}>
                  {s.category || "Uncategorized"} · {s.rating} ★ · {s.setup_complete ? "Live" : "Setup pending"}
                </Text>
              </View>
              <Pressable onPress={() => toggleOpen(s)} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>{s.is_open ? "Close" : "Open"}</Text>
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: "/admin/edit-shop", params: { shopId: s.id } })} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>Edit</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 60, gap: 8 },
  msg: { color: colors.danger, marginVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, gap: 8 },
  name: { fontFamily: typography.bodyBold, color: colors.text },
  sub: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 2 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.bg, borderRadius: radius.sm },
  smallBtnText: { color: colors.primary, fontFamily: typography.bodySemibold, fontSize: typography.small },
});
