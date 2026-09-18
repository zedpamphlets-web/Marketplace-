import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line } from "react-native-svg";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";
import { emojiForCategory } from "@/lib/categoryIcons";
import { Image } from "expo-image";

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string | null; icon_url?: string | null }[]>([]);
  const [active, setActive] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: catRows }, { data: productRows }] = await Promise.all([
      supabase.from("categories").select("id, name, icon, icon_url").order("sort_order"),
      supabase
        .from("products")
        .select("id, shop_id, name, price, image_url, rating, is_deal, category, badges, sold_count")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);
    const cats = (catRows as any[]) ?? [];
    setCategories(cats);
    if (!active && cats.length) setActive(cats[0].name);
    setProducts(
      (productRows ?? []).map((p: any) => ({
        id: p.id,
        shop_id: p.shop_id,
        name: p.name,
        price: Number(p.price),
        image_url: p.image_url,
        rating: p.rating,
        is_deal: p.is_deal,
        category: p.category,
        badges: p.badges ?? [],
        sold_count: p.sold_count ?? 0,
      }))
    );
    setLoading(false);
  }, [active]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const inCat = !active || !p.category || p.category === active;
      const inSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q);
      return q ? inSearch : inCat;
    });
  }, [products, active, search]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}>
            <Circle cx="11" cy="11" r="7" />
            <Line x1="21" y1="21" x2="16.65" y2="16.65" />
          </Svg>
          <TextInput
            placeholder="Search products"
            placeholderTextColor={colors.textFaint}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.trust}>
        <Text style={styles.trustText}>Free shipping</Text>
        <Text style={styles.trustDot}>·</Text>
        <Text style={styles.trustText}>Return if item damaged</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.body}>
          <ScrollView style={styles.side} showsVerticalScrollIndicator={false}>
            <Text style={styles.featured}>Categories</Text>
            {categories.length === 0 ? (
              <Text style={styles.emptySide}>No categories</Text>
            ) : (
              categories.map((c) => {
                const on = active === c.name;
                return (
                  <Pressable key={c.id} onPress={() => setActive(c.name)} style={[styles.sideItem, on && styles.sideOn]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {c.icon_url ? (
                      <Image source={{ uri: c.icon_url }} style={{ width: 18, height: 18, borderRadius: 4 }} contentFit="cover" />
                    ) : (
                      <Text>{emojiForCategory(c.icon, c.icon_url)}</Text>
                    )}
                    <Text style={[styles.sideText, on && styles.sideTextOn]} numberOfLines={2}>{c.name}</Text>
                  </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
            <Text style={styles.section}>{active || "All"}</Text>
            <View style={styles.grid}>
              {filtered.map((p) => (
                <View key={p.id} style={styles.gridItem}>
                  <ProductCard
                    product={p}
                    variant="home"
                    onAddToCart={async () => {
                      await addToCart({
                        id: p.id,
                        name: p.name,
                        shopName: "",
                        price: p.price,
                        image_url: p.image_url,
                        shop_id: p.shop_id,
                      });
                    }}
                  />
                </View>
              ))}
            </View>
            {filtered.length === 0 ? <Text style={styles.empty}>No products in this category</Text> : null}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: typography.body, color: colors.text, padding: 0 },
  trust: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  trustText: { fontSize: typography.tiny, color: colors.textMuted },
  trustDot: { color: colors.textFaint },
  body: { flex: 1, flexDirection: "row" },
  side: {
    width: 110,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },
  featured: {
    fontSize: typography.tiny,
    fontFamily: typography.bodyBold,
    color: colors.textFaint,
    padding: 12,
  },
  emptySide: { padding: 12, color: colors.textMuted, fontSize: typography.tiny },
  sideItem: { paddingHorizontal: 12, paddingVertical: 12 },
  sideOn: { backgroundColor: colors.primaryMuted },
  sideText: { fontSize: typography.small, color: colors.textSecondary },
  sideTextOn: { color: colors.primary, fontFamily: typography.bodySemibold },
  main: { flex: 1 },
  mainContent: { padding: spacing.md, paddingBottom: 40 },
  section: {
    fontFamily: typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48.5%" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 24 },
});
