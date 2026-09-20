// app/shop/[id].tsx
// Shop page — UI matched to the provided Shop screenshot.
// Shows shop header, promo banner, category pills, product grid with full Add to Cart buttons.
// Data from Supabase only (no fake products).

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

type Shop = {
  id: string;
  name: string;
  logo_url: string | null;
  banner_1: string | null;
  category: string | null;
  rating: number;
  is_open: boolean;
};

const FALLBACK_CATEGORIES = ["All", "Fashion", "Shoes", "Bags", "Dresses"];

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setNetworkError(false);
      const { data: shopRow } = await supabase
        .from("shops")
        .select("id, name, logo_url, banner_1, category, rating, is_open")
        .eq("id", id)
        .maybeSingle();

      setShop(shopRow as Shop | null);

      const { data: productRows } = await supabase
        .from("products")
        .select("id, shop_id, name, price, image_url, rating, is_deal, category")
        .eq("shop_id", id)
        .order("created_at", { ascending: false });

      const mapped: ProductCardData[] = (productRows ?? []).map((p: any) => ({
        id: p.id,
        shop_id: p.shop_id,
        name: p.name,
        price: Number(p.price),
        image_url: p.image_url,
        rating: p.rating,
        is_deal: p.is_deal,
        category: p.category,
        shop_name: shopRow?.name ?? null,
      }));
      setProducts(mapped);
    } catch (e) {
      setNetworkError(true);
      console.warn("Shop load error:", e);
      setShop(null);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = React.useMemo(() => {
    const fromProducts = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean) as string[])
    );
    if (fromProducts.length === 0) return FALLBACK_CATEGORIES;
    return ["All", ...fromProducts];
  }, [products]);

  const filtered =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  if (loading && !shop) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Shop not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
            <Path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.logoCircle}>
            {shop.logo_url ? (
              <Image source={{ uri: shop.logo_url }} style={styles.logoImg} contentFit="cover" />
            ) : (
              <Text style={styles.logoInitial}>
                {shop.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.shopName} numberOfLines={1}>
                {shop.name}
              </Text>
              <View style={styles.verified}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            </View>
            <Text style={styles.shopMeta} numberOfLines={1}>
              {shop.category ? `${shop.category} · ` : ""}
              Lusaka, Zambia
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
      >
        {/* Promo banner — only shown when banner_1 exists */}
        {shop.banner_1 ? (
          <View style={styles.promo}>
            <Image source={{ uri: shop.banner_1 }} style={styles.promoImg} contentFit="cover" />
          </View>
        ) : null}

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Products header */}
        <View style={styles.productsHeader}>
          <Text style={styles.productsCount}>
            Products · {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </Text>
          <Pressable style={styles.sortBtn}>
            <Text style={styles.sortBtnText}>Sort ▾</Text>
          </Pressable>
        </View>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No products in this category yet.</Text>
        ) : (
          <View style={styles.grid}>
            {filtered.map((p) => (
              <View key={p.id} style={styles.gridItem}>
                <ProductCard product={p} variant="shop" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  logoInitial: {
    color: "#fff",
    fontSize: 18,
    fontFamily: typography.displayFont,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  shopName: {
    fontSize: typography.h3,
    fontFamily: typography.displaySemibold,
    color: colors.text,
    flexShrink: 1,
  },
  verified: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  shopMeta: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    fontFamily: typography.bodyMedium,
    marginTop: 1,
  },
  promo: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: "hidden",
    height: 120,
    ...shadow.card,
  },
  promoImg: { width: "100%", height: "100%" },
  promoFallback: {
    flex: 1,
    backgroundColor: "#1F2937",
    padding: spacing.lg,
    justifyContent: "center",
  },
  promoTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: typography.displayFont,
    lineHeight: 26,
  },
  promoSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: typography.small,
    fontFamily: typography.bodyMedium,
    marginTop: 6,
  },
  pills: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.small,
    fontFamily: typography.bodySemibold,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: "#fff",
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  productsCount: {
    fontSize: typography.small,
    fontFamily: typography.bodySemibold,
    color: colors.text,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortBtnText: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontFamily: typography.bodyMedium,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  gridItem: {
    width: "48%",
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  notFoundText: {
    fontSize: typography.h3,
    fontFamily: typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  backLink: {
    padding: spacing.sm,
  },
  backLinkText: {
    color: colors.primary,
    fontFamily: typography.bodySemibold,
  },
});
