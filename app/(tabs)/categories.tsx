/**
 * Categories — Temu-style: Featured sidebar + Shop by category circular grid.
 * Offline-first: show cache immediately, refresh in background.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Svg, { Circle, Line } from "react-native-svg";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";
import { emojiForCategory } from "@/lib/categoryIcons";
import {
  readCategoriesCache,
  saveCategoriesCache,
  readProductsCache,
  mergeProductsCache,
} from "@/lib/catalogCache";

type Cat = { id: string; name: string; icon?: string | null; icon_url?: string | null };

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [toast, setToast] = useState("");
  const [hasCache, setHasCache] = useState(false);

  const loadCategories = useCallback(async () => {
    // Offline-first: paint cache immediately
    const cached = await readCategoriesCache<Cat>();
    if (cached.length) {
      setCategories(cached);
      setHasCache(true);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon, icon_url")
        .order("sort_order");
      if (error) throw error;
      setCategories((data as Cat[]) ?? []);
      await saveCategoriesCache(data ?? []);
    } catch (e) {
      console.warn(e);
      if (!cached.length) {
        const again = await readCategoriesCache<Cat>();
        setCategories(again);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const selectCategory = async (cat: Cat | null) => {
    if (!cat) {
      setActiveId(null);
      setActiveName(null);
      setProducts([]);
      return;
    }
    setActiveId(cat.id);
    setActiveName(cat.name);

    const mapRow = (p: any) => ({
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
      shop_name: p.shops?.name ?? p.shop_name ?? null,
    });

    // Show cached products for this category immediately
    const cached = await readProductsCache<any>();
    const local = cached
      .filter((p) => p.category && String(p.category).toLowerCase() === cat.name.toLowerCase())
      .map(mapRow);
    if (local.length) {
      setProducts(local);
      setLoadingProducts(false);
    } else {
      setLoadingProducts(true);
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, shop_id, name, price, image_url, rating, is_deal, category, badges, sold_count, shops(name)"
        )
        .ilike("category", cat.name)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProducts((data ?? []).map(mapRow));
      await mergeProductsCache(data ?? []);
    } catch (e) {
      console.warn(e);
      if (!local.length) setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filtered = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  const showBrowse = !activeId;
  const searchCats = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    : categories;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}>
            <Circle cx="11" cy="11" r="7" />
            <Line x1="21" y1="21" x2="16.65" y2="16.65" />
          </Svg>
          <TextInput
            placeholder={showBrowse ? "Search categories" : "Search products"}
            placeholderTextColor={colors.textFaint}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.trust}>
        <Text style={styles.trustText}>✓ Secure checkout</Text>
        <Text style={styles.trustDot}>|</Text>
        <Text style={styles.trustText}>✓ Fast delivery</Text>
      </View>

      <View style={styles.body}>
        {/* Featured sidebar */}
        <ScrollView style={styles.side} showsVerticalScrollIndicator={false}>
          <View style={styles.sideHeader}>
            <View style={styles.sideAccent} />
            <Text style={styles.sideHeaderText}>Featured</Text>
          </View>
          <Pressable
            onPress={() => selectCategory(null)}
            style={[styles.sideItem, !activeId && styles.sideOn]}
          >
            <Text style={[styles.sideText, !activeId && styles.sideTextOn]}>All</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => selectCategory(c)}
              style={[styles.sideItem, activeId === c.id && styles.sideOn]}
            >
              <Text style={[styles.sideText, activeId === c.id && styles.sideTextOn]} numberOfLines={2}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.main}>
          {loading && !hasCache ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : showBrowse ? (
            <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.section}>Shop by category</Text>
              <View style={styles.circleGrid}>
                {searchCats.map((c) => (
                  <Pressable key={c.id} style={styles.circleItem} onPress={() => selectCategory(c)}>
                    <View style={styles.circle}>
                      {c.icon_url ? (
                        <Image source={{ uri: c.icon_url }} style={styles.circleImg} contentFit="cover" />
                      ) : (
                        <Text style={styles.circleEmoji}>{emojiForCategory(c.icon, c.icon_url)}</Text>
                      )}
                    </View>
                    <Text style={styles.circleName} numberOfLines={2}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {categories.length === 0 && !loading ? (
                <Text style={styles.empty}>No categories yet</Text>
              ) : null}
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
              <View style={styles.productHeader}>
                <Text style={styles.section}>{activeName}</Text>
                <Pressable onPress={() => selectCategory(null)}>
                  <Text style={styles.backAll}>← All</Text>
                </Pressable>
              </View>
              {loadingProducts && products.length === 0 ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
              ) : (
                <>
                  <View style={styles.grid}>
                    {filtered.map((p) => (
                      <View key={p.id} style={styles.gridItem}>
                        <ProductCard
                          product={p}
                          variant="home"
                          onAddToCart={async (prod) => {
                            await addToCart({
                              id: prod.id,
                              name: prod.name,
                              shopName: prod.shop_name || "",
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
                  {filtered.length === 0 ? (
                    <Text style={styles.empty}>No products in this category</Text>
                  ) : null}
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>

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
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "#ECFDF5",
  },
  trustText: { fontSize: typography.tiny, color: "#15803D", fontFamily: typography.bodyMedium },
  trustDot: { color: "#86EFAC" },
  body: { flex: 1, flexDirection: "row" },
  side: {
    width: 108,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },
  sideHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
  },
  sideAccent: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: "#F97316",
  },
  sideHeaderText: {
    fontFamily: typography.bodyBold,
    fontSize: typography.small,
    color: colors.text,
  },
  sideItem: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  sideOn: { backgroundColor: colors.primaryMuted },
  sideText: { fontSize: typography.small, color: colors.textSecondary, lineHeight: 18 },
  sideTextOn: { color: colors.primary, fontFamily: typography.bodySemibold },
  main: { flex: 1 },
  mainContent: { padding: spacing.md, paddingBottom: 40 },
  section: {
    fontFamily: typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
    fontSize: typography.body,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  backAll: { color: colors.primary, fontFamily: typography.bodySemibold, fontSize: typography.small },
  circleGrid: { flexDirection: "row", flexWrap: "wrap" },
  circleItem: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: 4,
  },
  circle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circleImg: { width: "100%", height: "100%" },
  circleEmoji: { fontSize: 30 },
  circleName: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    fontFamily: typography.bodyMedium,
    color: colors.text,
    lineHeight: 14,
    paddingHorizontal: 2,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48.5%" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 24 },
  toast: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  toastText: { color: "#fff", fontFamily: typography.bodySemibold, fontSize: typography.small },
});
