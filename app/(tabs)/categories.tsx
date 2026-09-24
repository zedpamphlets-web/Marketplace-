/**
 * Categories — Alibaba-style: compact sidebar + recommendations,
 * small promo boxes, curated banners, then live product cards.
 * Products always load from data with a spinner (no skeleton / no product cache).
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";
import { emojiForCategory } from "@/lib/categoryIcons";
import {
  readCategoriesCache,
  saveCategoriesCache,
  readBannersCache,
  saveBannersCache,
} from "@/lib/catalogCache";

type Cat = { id: string; name: string; icon?: string | null; icon_url?: string | null };
type Banner = { id: string; title: string | null; subtitle: string | null; image_url: string | null };

const SIDE_SPECIAL = [
  { id: "for-you", name: "For you" },
  { id: "featured", name: "Featured" },
  { id: "deals", name: "Deals" },
];

function shortName(name: string) {
  const parts = name.split(/[&,/]/).map((s) => s.trim()).filter(Boolean);
  return parts[0] || name;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [activeId, setActiveId] = useState<string>("for-you");
  const [activeName, setActiveName] = useState<string>("For you");
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [toast, setToast] = useState("");

  const mapRow = (p: any): ProductCardData => ({
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
    original_price: p.original_price != null ? Number(p.original_price) : null,
    shop_name: p.shops?.name ?? p.shop_name ?? null,
  });

  const loadShell = useCallback(async () => {
    const cachedCats = await readCategoriesCache<Cat>();
    const cachedBanners = await readBannersCache<Banner>();
    if (cachedCats.length) setCategories(cachedCats);
    if (cachedBanners.length) setBanners(cachedBanners);
    try {
      const [{ data: catRows }, { data: bannerRows }] = await Promise.all([
        supabase.from("categories").select("id, name, icon, icon_url").order("sort_order"),
        supabase
          .from("banners")
          .select("id, title, subtitle, image_url")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);
      setCategories((catRows as Cat[]) ?? []);
      setBanners((bannerRows as Banner[]) ?? []);
      await saveCategoriesCache(catRows ?? []);
      await saveBannersCache(bannerRows ?? []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async (cat: { id: string; name: string }) => {
    setLoadingProducts(true);
    setProducts([]);
    try {
      let query = supabase
        .from("products")
        .select(
          "id, shop_id, name, price, image_url, rating, is_deal, category, badges, sold_count, original_price, shops(name)"
        )
        .order("created_at", { ascending: false })
        .limit(40);

      if (cat.id === "deals") {
        query = query.eq("is_deal", true);
      } else if (cat.id !== "for-you" && cat.id !== "featured") {
        query = query.ilike("category", cat.name);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts((data ?? []).map(mapRow));
    } catch (e) {
      console.warn(e);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadShell();
    loadProducts({ id: "for-you", name: "For you" });
  }, [loadShell, loadProducts]);

  const select = (cat: { id: string; name: string }) => {
    setActiveId(cat.id);
    setActiveName(cat.name);
    loadProducts(cat);
  };

  const showBrowse = activeId === "for-you" || activeId === "featured";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.head}>
        <Text style={styles.headTitle}>Categories</Text>
      </View>

      <View style={styles.body}>
        <ScrollView style={styles.side} showsVerticalScrollIndicator={false}>
          {SIDE_SPECIAL.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => select(s)}
              style={[styles.sideItem, activeId === s.id && styles.sideOn]}
            >
              {activeId === s.id ? <View style={styles.sideBar} /> : null}
              <Text style={[styles.sideText, activeId === s.id && styles.sideTextOn]} numberOfLines={2}>
                {s.name}
              </Text>
            </Pressable>
          ))}
          {categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => select(c)}
              style={[styles.sideItem, activeId === c.id && styles.sideOn]}
            >
              {activeId === c.id ? <View style={styles.sideBar} /> : null}
              <Text style={[styles.sideText, activeId === c.id && styles.sideTextOn]} numberOfLines={3}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView style={styles.main} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
          {showBrowse ? (
            <>
              <View style={styles.localBanner}>
                <Image
                  source={require("../../assets/promo-local-stock.jpg")}
                  style={styles.localImg}
                  contentFit="cover"
                />
                <View style={styles.localCopy}>
                  <Text style={styles.localTitle}>local stock</Text>
                  <Text style={styles.localLine}>✓ Fastest delivery in 5 days</Text>
                  <Text style={styles.localLine}>✓ No import charges</Text>
                </View>
              </View>

              <Text style={styles.section}>Recommendations</Text>
              {loading && categories.length === 0 ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.circleGrid}>
                  {categories.map((c, i) => (
                    <Pressable key={c.id} style={styles.circleItem} onPress={() => select(c)}>
                      <View style={styles.circle}>
                        {c.icon_url ? (
                          <Image source={{ uri: c.icon_url }} style={styles.circleImg} contentFit="cover" />
                        ) : i === 0 ? (
                          <View style={styles.hotCircle}>
                            <Text style={styles.hotText}>HOT</Text>
                          </View>
                        ) : (
                          <Text style={styles.circleEmoji}>{emojiForCategory(c.icon, c.icon_url)}</Text>
                        )}
                        {i % 4 === 2 ? <Text style={styles.fire}>🔥</Text> : null}
                      </View>
                      <Text style={styles.circleName} numberOfLines={2}>
                        {shortName(c.name)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.miniPromos}>
                <View style={styles.miniPromo}>
                  <Text style={styles.miniPromoTitle}>Free shipping</Text>
                  <Text style={styles.miniPromoSub}>First order</Text>
                </View>
                <View style={[styles.miniPromo, styles.miniPromoAlt]}>
                  <Text style={styles.miniPromoTitle}>Order protection</Text>
                  <Text style={styles.miniPromoSub}>Pay to delivery</Text>
                </View>
              </View>

              {banners.length > 0 ? (
                <>
                  <Text style={styles.section}>Curated products</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {banners.map((b) => (
                      <Pressable key={b.id} style={styles.curated}>
                        {b.image_url ? (
                          <Image source={{ uri: b.image_url }} style={styles.curatedImg} contentFit="cover" />
                        ) : (
                          <View style={[styles.curatedImg, { backgroundColor: colors.primaryMuted, padding: 12 }]}>
                            <Text style={styles.curatedTitle} numberOfLines={2}>
                              {b.title || "Promotion"}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.curatedCap} numberOfLines={2}>
                          {b.title || "Featured"}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : null}
            </>
          ) : (
            <Text style={styles.section}>{activeName}</Text>
          )}

          <Text style={[styles.section, { marginTop: 18 }]}>Get product inspiration</Text>
          {loadingProducts ? (
            <View style={styles.spinnerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.spinnerLabel}>Loading products…</Text>
            </View>
          ) : products.length === 0 ? (
            <Text style={styles.empty}>No products in this category</Text>
          ) : (
            <View style={styles.grid}>
              {products.map((p) => (
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
          )}
        </ScrollView>
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
  head: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headTitle: {
    fontFamily: typography.displaySemibold,
    fontSize: 22,
    color: colors.text,
  },
  body: { flex: 1, flexDirection: "row" },
  side: {
    width: 92,
    backgroundColor: "#F3F1EA",
  },
  sideItem: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center",
    position: "relative",
  },
  sideOn: { backgroundColor: colors.surface },
  sideBar: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sideText: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    fontFamily: typography.bodyMedium,
  },
  sideTextOn: { color: colors.text, fontFamily: typography.bodyBold },
  main: { flex: 1, backgroundColor: colors.surface },
  mainContent: { padding: 12, paddingBottom: 48 },
  localBanner: {
    flexDirection: "row",
    backgroundColor: "#1F7A3A",
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: 16,
    height: 72,
  },
  localImg: { width: 88, height: "100%" },
  localCopy: { flex: 1, paddingHorizontal: 10, justifyContent: "center" },
  localTitle: { color: "#fff", fontFamily: typography.bodyBold, fontSize: 14, marginBottom: 2 },
  localLine: { color: "rgba(255,255,255,0.92)", fontSize: 10 },
  section: {
    fontFamily: typography.bodyBold,
    color: colors.text,
    marginBottom: 12,
    fontSize: 16,
  },
  circleGrid: { flexDirection: "row", flexWrap: "wrap" },
  circleItem: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F6F3EA",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  circleImg: { width: "100%", height: "100%" },
  circleEmoji: { fontSize: 26 },
  hotCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  hotText: { color: colors.primary, fontFamily: typography.bodyBold, fontSize: 12 },
  fire: { position: "absolute", top: 0, right: 0, fontSize: 12 },
  circleName: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 13,
    fontFamily: typography.bodyMedium,
    color: colors.text,
    width: "100%",
    paddingHorizontal: 2,
  },
  miniPromos: { flexDirection: "row", gap: 8, marginBottom: 16, marginTop: 4 },
  miniPromo: {
    flex: 1,
    backgroundColor: "#FFF7E0",
    borderRadius: radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F3E2A8",
  },
  miniPromoAlt: { backgroundColor: "#FFF1F0", borderColor: "#FAD4D0" },
  miniPromoTitle: { fontFamily: typography.bodyBold, fontSize: 11, color: colors.text },
  miniPromoSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  curated: { width: 200 },
  curatedImg: { width: 200, height: 110, borderRadius: radius.md, overflow: "hidden" },
  curatedTitle: { fontFamily: typography.bodyBold, color: colors.text },
  curatedCap: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.bodyMedium,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48.5%" },
  spinnerBox: { alignItems: "center", paddingVertical: 28, gap: 8 },
  spinnerLabel: { color: colors.textMuted, fontSize: 13 },
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
