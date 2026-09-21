// app/shop/[id].tsx
// Shop page — header, real banner only, category pills, product grid.

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
import { addToCart } from "@/lib/cart";
import { mergeProductsCache, readProductsCache, readShopsCache } from "@/lib/catalogCache";

type Shop = {
  id: string;
  name: string;
  logo_url: string | null;
  banner_1: string | null;
  category: string | null;
  rating: number;
  is_open: boolean;
};

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setNetworkError(false);
      const { data: shopRow, error: shopErr } = await supabase
        .from("shops")
        .select("id, name, logo_url, banner_1, category, rating, is_open")
        .eq("id", id)
        .maybeSingle();

      if (shopErr) throw shopErr;

      setShop(shopRow as Shop | null);

      const { data: productRows, error: prodErr } = await supabase
        .from("products")
        .select("id, shop_id, name, price, image_url, rating, is_deal, category, badges, sold_count")
        .eq("shop_id", id)
        .order("created_at", { ascending: false });

      if (prodErr) throw prodErr;

      const mapped: ProductCardData[] = (productRows ?? []).map((p: any) => ({
        id: p.id,
        shop_id: p.shop_id,
        name: p.name,
        price: Number(p.price),
        image_url: p.image_url,
        rating: p.rating,
        is_deal: p.is_deal,
        category: p.category,
        badges: p.badges,
        sold_count: p.sold_count,
        shop_name: shopRow?.name ?? null,
      }));
      setProducts(mapped);
      await mergeProductsCache(productRows ?? []);
    } catch (e: any) {
      setNetworkError(true);
      console.warn("Shop load error:", e);
      // Offline fallback from cache
      const shops = await readShopsCache<any>();
      const found = shops.find((s) => s.id === id);
      if (found) {
        setShop(found as Shop);
        setNetworkError(false);
        const cached = await readProductsCache<any>();
        const mapped = cached
          .filter((p) => p.shop_id === id)
          .map((p: any) => ({
            id: p.id,
            shop_id: p.shop_id,
            name: p.name,
            price: Number(p.price),
            image_url: p.image_url,
            rating: p.rating,
            is_deal: p.is_deal,
            category: p.category,
            badges: p.badges,
            sold_count: p.sold_count,
            shop_name: found.name ?? null,
          }));
        setProducts(mapped);
      } else {
        setShop(null);
        setProducts([]);
      }
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
    if (fromProducts.length === 0) return ["All"];
    return ["All", ...fromProducts];
  }, [products]);

  const filtered =
    activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  if (loading && !shop) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (networkError && !shop) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>No internet connection</Text>
          <Text style={styles.notFoundSub}>Please check your connection and try again.</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              load();
            }}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </Pressable>
        </View>
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
              <Text style={styles.logoInitial}>{shop.name.charAt(0).toUpperCase()}</Text>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Real banner only — no fake promo text */}
        {shop.banner_1 ? (
          <View style={styles.promo}>
            <Image source={{ uri: shop.banner_1 }} style={styles.promoImg} contentFit="cover" />
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
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

        <View style={styles.productsHeader}>
          <Text style={styles.productsCount}>
            Products · {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.grid}>
          {filtered.map((p) => (
            <View key={p.id} style={styles.gridItem}>
              <ProductCard
                product={p}
                variant="shop"
                onAddToCart={async (prod) => {
                  await addToCart({
                    id: prod.id,
                    name: prod.name,
                    shopName: shop.name,
                    price: prod.price,
                    image_url: prod.image_url,
                    shop_id: prod.shop_id,
                  });
                  setToast("Added to cart");
                  setTimeout(() => setToast(""), 1400);
                }}
              />
            </View>
          ))}
        </View>
        {filtered.length === 0 ? <Text style={styles.empty}>No products in this category</Text> : null}
      </ScrollView>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
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
    gap: 10,
  },
  backBtn: { minWidth: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: "100%", height: "100%" },
  logoInitial: { fontFamily: typography.displayFont, color: colors.primary, fontSize: 18 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  shopName: { fontFamily: typography.displaySemibold, fontSize: typography.body, color: colors.text, flexShrink: 1 },
  verified: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  shopMeta: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 2 },
  promo: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: "hidden",
    height: 120,
    ...shadow.card,
  },
  promoImg: { width: "100%", height: "100%" },
  pills: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: typography.small, fontFamily: typography.bodySemibold, color: colors.textMuted },
  pillTextActive: { color: "#fff" },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  productsCount: { fontSize: typography.small, fontFamily: typography.bodySemibold, color: colors.text },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  gridItem: { width: "48%" },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  notFoundText: {
    fontSize: typography.h3,
    fontFamily: typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  notFoundSub: {
    fontSize: typography.small,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  retryText: { color: "#fff", fontFamily: typography.bodySemibold },
  backLink: { padding: spacing.sm },
  backLinkText: { color: colors.primary, fontFamily: typography.bodySemibold },
  toast: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  toastText: { color: "#fff", fontFamily: typography.bodySemibold, fontSize: typography.small },
});
