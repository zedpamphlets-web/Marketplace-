import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { setBannerLinkCache } from "@/lib/catalogCache";

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
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setMessage("");
      const [{ data: banner, error: bErr }, { data: allProducts, error: pErr }, { data: links, error: lErr }] =
        await Promise.all([
          supabase.from("banners").select("title").eq("id", id).maybeSingle(),
          supabase.from("products").select("id, name, price, image_url").order("name").limit(300),
          supabase.from("banner_products").select("product_id").eq("banner_id", id),
        ]);

      if (bErr) throw bErr;
      if (pErr) throw pErr;
      // If banner_products table is missing, surface a clear message
      if (lErr) {
        setMessage(
          lErr.message.includes("does not exist") || lErr.code === "42P01"
            ? "Run the banner_products SQL in Supabase first (see schema.sql)."
            : lErr.message
        );
      }

      setBannerTitle(banner?.title || "Banner");
      setProducts((allProducts as Product[]) ?? []);
      const ids = (links ?? []).map((l: any) => l.product_id as string);
      setLinked(new Set(ids));
      // Keep offline cache in sync
      await setBannerLinkCache(id, ids);
    } catch (e: any) {
      setMessage(e?.message || "Could not load. Ensure banner_products table exists in Supabase.");
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
    if (!id || savingId) return;
    setSavingId(productId);
    setMessage("");
    const next = new Set(linked);
    try {
      if (next.has(productId)) {
        const { error } = await supabase
          .from("banner_products")
          .delete()
          .eq("banner_id", id)
          .eq("product_id", productId);
        if (error) throw error;
        next.delete(productId);
      } else {
        const { error } = await supabase.from("banner_products").insert({
          banner_id: id,
          product_id: productId,
        });
        if (error) throw error;
        next.add(productId);
      }
      setLinked(next);
      await setBannerLinkCache(id, Array.from(next));
    } catch (e: any) {
      const msg = e?.message || "Could not save link";
      // Common RLS / missing-table hints
      if (/permission|policy|RLS/i.test(msg)) {
        setMessage("Save blocked by database policy. Run the banner_products policies SQL while signed in as admin.");
      } else if (/does not exist|42P01/i.test(msg)) {
        setMessage("Table banner_products is missing. Run the SQL from schema.sql in Supabase.");
      } else {
        setMessage(msg);
      }
    } finally {
      setSavingId(null);
    }
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
          Select products for “{bannerTitle}”. Customers see these when they tap the banner on Home.
        </Text>
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : products.length === 0 ? (
          <EmptyState title="No products" subtitle="Add products first." />
        ) : (
          products.map((p) => {
            const on = linked.has(p.id);
            const busy = savingId === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => toggle(p.id)}
                disabled={!!savingId}
                style={[styles.row, on && styles.rowOn, busy && { opacity: 0.6 }]}
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
                <Text style={[styles.check, on && styles.checkOn]}>{busy ? "…" : on ? "✓" : "○"}</Text>
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
  msg: { color: colors.danger, marginBottom: 12, fontFamily: typography.bodyMedium },
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
