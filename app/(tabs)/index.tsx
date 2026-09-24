import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { ShopCard, type ShopCardData } from "@/components/ShopCard";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { AppMenu } from "@/components/AppMenu";
import { SectionHeader } from "@/components/Shared";
import { BagLogo } from "@/components/BrandMark";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";
import { useUserRole } from "@/lib/useUserRole";
import { Image } from "expo-image";
import { emojiForCategory } from "@/lib/categoryIcons";
import { saveHomeShellCache, readHomeShellCache } from "@/lib/homeCache";
import {
  saveShopsCache,
  saveCategoriesCache,
  saveBannersCache,
  readShopsCache,
  readCategoriesCache,
  readBannersCache,
} from "@/lib/catalogCache";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_GAP = spacing.md;
const BANNER_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const BANNER_STEP = BANNER_WIDTH + BANNER_GAP;
const AUTO_SWAP_MS = 4000;
const PAGE_SIZE = 10;

function mapProduct(p: any): ProductCardData {
  return {
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
    original_price: p.original_price != null ? Number(p.original_price) : null,
  };
}

export default function HomeScreen() {
  const role = useUserRole();
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<ShopCardData[]>([]);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [categories, setCategories] = useState<
    { id: string; name: string; icon?: string | null; icon_url?: string | null }[]
  >([]);
  const [banners, setBanners] = useState<
    { id: string; title: string | null; subtitle: string | null; image_url: string | null }[]
  >([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<ScrollView>(null);
  const bannerIndexRef = useRef(0);
  const pageRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const fetchProductsPage = useCallback(async (page: number) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("products")
      .select("id, shop_id, name, price, image_url, rating, is_deal, category, badges, sold_count, original_price")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  }, []);

  const loadShell = useCallback(async () => {
    const [{ data: shopRows }, { data: catRows }, { data: bannerRows }] = await Promise.all([
      supabase
        .from("shops")
        .select("id, name, logo_url, category, rating, is_open")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("categories").select("id, name, icon, icon_url").order("sort_order"),
      supabase
        .from("banners")
        .select("id, title, subtitle, image_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ]);
    const shopsData = (shopRows as ShopCardData[]) ?? [];
    const catsData = (catRows as any[]) ?? [];
    const bannersData = (bannerRows as any[]) ?? [];
    setShops(shopsData);
    setCategories(catsData);
    setBanners(bannersData);
    setBannerIndex(0);
    bannerIndexRef.current = 0;
    await saveShopsCache(shopsData);
    await saveCategoriesCache(catsData);
    await saveBannersCache(bannersData);
    return { shops: shopsData, categories: catsData, banners: bannersData };
  }, []);

  const paintCachedShell = useCallback(async () => {
    const cachedShell = await readHomeShellCache();
    const shops = cachedShell?.shops?.length ? cachedShell.shops : await readShopsCache();
    const cats = cachedShell?.categories?.length ? cachedShell.categories : await readCategoriesCache();
    const bans = cachedShell?.banners?.length ? cachedShell.banners : await readBannersCache();
    if (shops.length) setShops(shops);
    if (cats.length) setCategories(cats);
    if (bans.length) setBanners(bans);
    return { shops, categories: cats, banners: bans };
  }, []);

  const loadFirstPage = useCallback(async () => {
    // Offline: banners + shops (and category chips) only.
    await paintCachedShell();
    // Products always come from live data — spinner, never skeleton / cache.
    setProducts([]);
    setInitialLoading(true);
    try {
      const shell = await loadShell();
      await saveHomeShellCache(shell);
      const first = await fetchProductsPage(0);
      setProducts(first);
      setHasMore(first.length >= PAGE_SIZE);
      pageRef.current = 1;
    } catch (e) {
      console.warn(e);
      setProducts([]);
      setHasMore(false);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [fetchProductsPage, loadShell, paintCachedShell]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current || search.trim() || initialLoading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const next = await fetchProductsPage(pageRef.current);
      setProducts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...next.filter((p) => !ids.has(p.id))];
      });
      setHasMore(next.length >= PAGE_SIZE);
      pageRef.current += 1;
    } catch (e) {
      console.warn(e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchProductsPage, hasMore, search, initialLoading]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      const next = (bannerIndexRef.current + 1) % banners.length;
      bannerIndexRef.current = next;
      setBannerIndex(next);
      bannerRef.current?.scrollTo({ x: next * BANNER_STEP, animated: true });
    }, AUTO_SWAP_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / BANNER_STEP);
    if (idx !== bannerIndexRef.current && idx >= 0 && idx < banners.length) {
      bannerIndexRef.current = idx;
      setBannerIndex(idx);
    }
  };

  const filtered = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  const onAdd = async (p: ProductCardData) => {
    await addToCart({
      id: p.id,
      name: p.name,
      shopName: p.shop_name || "",
      price: p.price,
      image_url: p.image_url,
      shop_id: p.shop_id,
    });
    setToast("Added to cart");
    setTimeout(() => setToast(""), 1400);
  };

  const onMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 280;
    if (nearBottom) loadMore();
  };

  const promoTitle = banners[0]?.title || "";
  const promoSub = banners[0]?.subtitle || "";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {promoTitle || promoSub ? (
        <View style={styles.promoBar}>
          <Text style={styles.promoKicker}>ShopTrory</Text>
          <Text style={styles.promoTitle} numberOfLines={1}>
            {[promoTitle, promoSub].filter(Boolean).join(" · ")}
          </Text>
        </View>
      ) : null}

      <View style={styles.topBar}>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} style={styles.iconBtn}>
          <BagLogo size={26} />
        </Pressable>

        <View style={styles.searchBox}>
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
            returnKeyType="search"
          />
          <Pressable hitSlop={8} style={styles.cameraBtn}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}>
              <Path d="M4 8h3l2-2h6l2 2h3v11H4V8z" strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx="12" cy="13" r="3.5" />
            </Svg>
          </Pressable>
          <Pressable style={styles.searchGo}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.onPrimary} strokeWidth={2.2}>
              <Circle cx="11" cy="11" r="7" />
              <Line x1="21" y1="21" x2="16.65" y2="16.65" />
            </Svg>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/cart")} hitSlop={10} style={styles.iconBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
            <Circle cx="9" cy="20" r="1.4" />
            <Circle cx="18" cy="20" r="1.4" />
            <Path d="M2 3h2l2.4 12.6a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onMainScroll}
        scrollEventThrottle={120}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFirstPage();
            }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catStrip}
          >
            {categories.map((c) => (
              <Pressable
                key={c.id}
                style={styles.catChip}
                onPress={() => router.push("/(tabs)/categories")}
              >
                <View style={styles.catDot}>
                  {c.icon_url ? (
                    <Image source={{ uri: c.icon_url }} style={styles.catDotImg} contentFit="cover" />
                  ) : (
                    <Text style={styles.catEmoji}>{emojiForCategory(c.icon, c.icon_url)}</Text>
                  )}
                </View>
                <Text style={styles.catChipText} numberOfLines={2}>
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {banners.length > 0 ? (
          <View style={styles.bannerBlock}>
            <ScrollView
              ref={bannerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={BANNER_STEP}
              snapToAlignment="start"
              onMomentumScrollEnd={onBannerScroll}
              contentContainerStyle={styles.bannerScroll}
            >
              {banners.map((b) => (
                <Pressable
                  key={b.id}
                  style={[styles.bannerSlide, { width: BANNER_WIDTH }]}
                  onPress={() => router.push(`/promotions/${b.id}` as any)}
                >
                  {b.image_url ? (
                    <Image source={{ uri: b.image_url }} style={styles.bannerImage} contentFit="cover" transition={200} />
                  ) : (
                    <View style={styles.bannerTextOnly}>
                      <Text style={styles.bannerTitle} numberOfLines={1}>
                        {b.title || "Offer"}
                      </Text>
                      {b.subtitle ? (
                        <Text style={styles.bannerSub} numberOfLines={2}>
                          {b.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
            {banners.length > 1 ? (
              <View style={styles.dots}>
                {banners.map((b, i) => (
                  <View key={b.id} style={[styles.dot, i === bannerIndex && styles.dotOn]} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {shops.length > 0 ? (
          <View style={styles.block}>
            <SectionHeader
              title="Shops"
              actionLabel="See all"
              onPressAction={() => router.push("/(tabs)/categories")}
            />
            <FlatList
              data={shops}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(s) => s.id}
              renderItem={({ item }) => <ShopCard shop={item} />}
              contentContainerStyle={{ paddingRight: spacing.lg }}
            />
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Products" />
          {initialLoading ? (
            <View style={styles.spinnerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.spinnerLabel}>Loading products…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <Text style={styles.empty}>No products found</Text>
          ) : (
            <View style={styles.grid}>
              {filtered.map((p) => (
                <View key={p.id} style={styles.gridItem}>
                  <ProductCard product={p} variant="home" onAddToCart={onAdd} />
                </View>
              ))}
            </View>
          )}
          {loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> : null}
        </View>

        {role.type === "guest" ? (
          <View style={styles.guestBox}>
            <Text style={styles.guestText}>Sign in for a better shopping experience</Text>
            <Pressable style={styles.signBtn} onPress={() => router.push("/auth/login")}>
              <Text style={styles.signBtnText}>Sign in</Text>
            </Pressable>
          </View>
        ) : null}
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
  promoBar: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promoKicker: {
    backgroundColor: colors.onPrimary,
    color: colors.primary,
    fontSize: 10,
    fontFamily: typography.bodyBold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: "hidden",
  },
  promoTitle: {
    flex: 1,
    color: colors.onPrimary,
    fontFamily: typography.bodySemibold,
    fontSize: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingLeft: 12,
    paddingRight: 4,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: typography.small, color: colors.text, padding: 0 },
  cameraBtn: { padding: 2 },
  searchGo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingBottom: 40 },
  catStrip: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: 10 },
  catChip: { width: 72, alignItems: "center" },
  catDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  catDotImg: { width: "100%", height: "100%" },
  catEmoji: { fontSize: 22 },
  catChipText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 12,
    color: colors.text,
    fontFamily: typography.bodyMedium,
    width: 72,
  },
  promoBoxes: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  promoBox: {
    flex: 1,
    backgroundColor: "#FFF7E0",
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F3E2A8",
  },
  promoBoxAlt: { backgroundColor: "#FFF1F0", borderColor: "#FAD4D0" },
  promoBoxTitle: { fontFamily: typography.bodyBold, fontSize: 12, color: colors.text },
  promoBoxSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  bannerBlock: { marginTop: spacing.md },
  bannerScroll: { paddingHorizontal: spacing.lg },
  bannerSlide: {
    height: 140,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginRight: BANNER_GAP,
    backgroundColor: colors.primaryMuted,
  },
  bannerImage: { width: "100%", height: "100%" },
  bannerTextOnly: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  bannerTitle: { color: colors.onPrimary, fontFamily: typography.displaySemibold, fontSize: typography.h3 },
  bannerSub: { color: "rgba(17,17,17,0.75)", marginTop: 4, fontSize: typography.small },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.primary, width: 16 },
  block: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48.5%" },
  spinnerBox: { alignItems: "center", paddingVertical: 36, gap: 10 },
  spinnerLabel: { color: colors.textMuted, fontSize: typography.small },
  empty: { textAlign: "center", color: colors.textMuted, marginVertical: 24 },
  guestBox: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  guestText: {
    color: colors.text,
    fontFamily: typography.bodyMedium,
    fontSize: typography.small,
    marginBottom: 12,
  },
  signBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  signBtnText: { color: colors.onPrimary, fontFamily: typography.bodyBold, fontSize: typography.small },
  toast: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  toastText: { color: "#fff", fontSize: typography.small, fontFamily: typography.bodySemibold },
});
