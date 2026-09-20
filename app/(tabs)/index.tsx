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
import { SectionHeader, Skeleton } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";
import { useUserRole } from "@/lib/useUserRole";
import { Image } from "expo-image";
import {
  readHomeProductsCache,
  saveHomeProductsCache,
  readHomeShellCache,
  saveHomeShellCache,
} from "@/lib/homeCache";

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
  };
}

function ProductSkeletonGrid() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <View style={styles.skelCard}>
            <Skeleton width="100%" height={150} style={{ borderRadius: 0 }} />
            <View style={{ padding: 8, gap: 6 }}>
              <Skeleton width="40%" height={10} />
              <Skeleton width="90%" height={12} />
              <Skeleton width="55%" height={14} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
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
      .select("id, shop_id, name, price, image_url, rating, is_deal, category, badges, sold_count")
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
    return { shops: shopsData, categories: catsData, banners: bannersData };
  }, []);

  const loadFirstPage = useCallback(async () => {
    setInitialLoading(true);
    pageRef.current = 0;
    try {
      const shell = await loadShell();
      const first = await fetchProductsPage(0);
      setProducts(first);
      setHasMore(first.length >= PAGE_SIZE);
      pageRef.current = 1;
      await saveHomeShellCache(shell);
      await saveHomeProductsCache(first);
    } catch (e) {
      console.warn(e);
      const cachedShell = await readHomeShellCache();
      const cachedProducts = await readHomeProductsCache();
      if (cachedShell) {
        setShops(cachedShell.shops);
        setCategories(cachedShell.categories);
        setBanners(cachedShell.banners);
      } else {
        setShops([]);
        setCategories([]);
        setBanners([]);
      }
      if (cachedProducts.length) {
        setProducts(cachedProducts);
        setHasMore(false);
      } else {
        setProducts([]);
        setHasMore(false);
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [fetchProductsPage, loadShell]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current || search.trim()) return;
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
  }, [fetchProductsPage, hasMore, search]);

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

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Top row: menu | search + camera | bell | cart */}
      <View style={styles.topBar}>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} style={styles.iconBtn}>
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, { width: 14 }]} />
          <View style={styles.menuLine} />
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
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={1.8}>
              <Path d="M4 8h3l2-2h6l2 2h3v11H4V8z" strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx="12" cy="13" r="3.5" />
            </Svg>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/orders")}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

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
                    <Image
                      source={{ uri: b.image_url }}
                      style={styles.bannerImage}
                      contentFit="cover"
                      transition={200}
                    />
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

        {/* Category pills removed — use Categories tab */}

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
            <ProductSkeletonGrid />
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
            <Pressable style={styles.signBtn} onPress={() => router.push("/auth/sign-in" as any)}>
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
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: colors.text,
    borderRadius: 1,
    marginVertical: 2,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.small,
    color: colors.text,
    padding: 0,
  },
  cameraBtn: { padding: 2 },
  scrollContent: { paddingBottom: 40 },
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
  bannerTitle: { color: "#fff", fontFamily: typography.displaySemibold, fontSize: typography.h3 },
  bannerSub: { color: "rgba(255,255,255,0.9)", marginTop: 4, fontSize: typography.small },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.primary, width: 16 },
  block: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%" },
  skelCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...shadow.card,
  },
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
  guestText: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: typography.small, marginBottom: 12 },
  signBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  signBtnText: { color: "#fff", fontFamily: typography.bodyBold, fontSize: typography.small },
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
