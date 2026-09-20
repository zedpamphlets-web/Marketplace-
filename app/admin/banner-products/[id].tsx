import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
};

export default function BannerProductsAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [bannerTitle, setBannerTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [{ data: banner }, { data: allProducts }, { data: links }] = await Promise.all([
        supabase.from("banners").select("title").eq("id", id).maybeSingle(),
        supabase.from("products").select("id, name, price, image_url").order("name").limit(200),
        supabase.from("banner_products").select("product_id").eq("banner_id", id),
      ]);
      setBannerTitle(banner?.title || "Banner");
      setProducts((allProducts as Product[]) ?? []);
      setLinked(new Set((links ?? []).map((l: any) => l.product_id)));
      setMessage("");
    } catch (e: any) {
      setMessage(e?.message || "Could not load. Ensure banner_products table exists.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = async (productId: string) => {
    if (!id) return;
    const next = new Set(linked);
    if (next.has(productId)) {
      next.delete(productId);
      await supabase.from("banner_products").delete().eq("banner_id", id).eq("product_id", productId);
    } else {
      next.add(productId);
      await supabase.from("banner_products").insert({ banner_id: id, product_id: productId });
    }
    setLinked(next);
  };

  return (
    <AdminShell title="Banner products">
      <ScrollView
        contentContainerStyle={styles.content}
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
        <Text style={styles.intro}>
          Select products for “{bannerTitle}”. Customers see these when they tap the banner.
        </Text>
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : products.length === 0 ? (
          <EmptyState title="No products" subtitle="Add products first." />
        ) : (
          products.map((p) => {
            const on = linked.has(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => toggle(p.id)}
                style={[styles.row, on && styles.rowOn]}
              >
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.border }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.price}>K{Number(p.price).toLocaleString()}</Text>
                </View>
                <Text style={[styles.check, on && styles.checkOn]}>{on ? "✓" : "○"}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  intro: { color: colors.adminMuted, marginBottom: spacing.md, fontSize: typography.small },
  msg: { color: colors.danger, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: 8,
    backgroundColor: colors.adminCard,
  },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  thumb: { width: 48, height: 48, borderRadius: 8 },
  name: { fontFamily: typography.bodySemibold, color: colors.adminText },
  price: { color: colors.adminMuted, fontSize: typography.tiny, marginTop: 2 },
  check: { fontSize: 20, color: colors.adminMuted },
  checkOn: { color: colors.primary, fontWeight: "700" },
});
