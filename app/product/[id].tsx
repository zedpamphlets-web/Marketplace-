import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductBadgeRow } from "@/components/ProductBadges";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";
import { getCachedProductById, mergeProductsCache, readProductsCache } from "@/lib/catalogCache";

const { width: SCREEN_W } = Dimensions.get("window");

type Product = {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  image_url: string | null;
  images?: string[] | null;
  rating: number | null;
  category: string | null;
  badges: string[] | null;
  sold_count: number | null;
  description?: string | null;
  shops?: { id: string; name: string; whatsapp_number?: string | null } | null;
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<ProductCardData[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const galleryRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, shop_id, name, price, image_url, images, rating, category, badges, sold_count, description, shops(id, name, whatsapp_number)"
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      setProduct((data as Product) ?? null);
      if (data) await mergeProductsCache([data]);

      if (data?.category) {
        const { data: more } = await supabase
          .from("products")
          .select(
            "id, shop_id, name, price, image_url, rating, is_deal, category, badges, sold_count, shops(name)"
          )
          .eq("category", data.category)
          .neq("id", id)
          .limit(8);
        setSimilar(
          (more ?? []).map((p: any) => ({
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
            shop_name: p.shops?.name ?? null,
          }))
        );
        if (more?.length) await mergeProductsCache(more);
      } else {
        setSimilar([]);
      }
    } catch (e) {
      console.warn(e);
      const cached = await getCachedProductById(id);
      if (cached) {
        setProduct(cached as Product);
        const all = await readProductsCache<any>();
        const sim = all
          .filter((p) => p.category && cached.category && p.category === cached.category && p.id !== id)
          .slice(0, 8)
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
            shop_name: p.shop_name ?? null,
          }));
        setSimilar(sim);
      } else {
        setProduct(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const photos: string[] = React.useMemo(() => {
    if (!product) return [];
    const fromList = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    if (fromList.length) return fromList as string[];
    if (product.image_url) return [product.image_url];
    return [];
  }, [product]);

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_W);
    if (idx !== photoIndex && idx >= 0 && idx < photos.length) setPhotoIndex(idx);
  };

  const onAdd = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(
        {
          id: product.id,
          name: product.name,
          shopName: product.shops?.name || "",
          price: Number(product.price),
          image_url: product.image_url,
          shop_id: product.shop_id,
        },
        qty
      );
      setToast(`Added ${qty} to cart`);
      setTimeout(() => setToast(""), 1600);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Product not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const shopName = product.shops?.name ?? "Shop";
  const shopId = product.shops?.id ?? product.shop_id;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
            <Path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Product
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/cart")} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.cartLink}>Cart</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Image gallery */}
        <View style={styles.galleryWrap}>
          {photos.length > 1 ? (
            <>
              <ScrollView
                ref={galleryRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onGalleryScroll}
              >
                {photos.map((uri, i) => (
                  <Image key={uri + i} source={{ uri }} style={styles.galleryImage} contentFit="cover" />
                ))}
              </ScrollView>
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex && styles.dotOn]} />
                ))}
              </View>
            </>
          ) : photos.length === 1 ? (
            <Image source={{ uri: photos[0] }} style={styles.galleryImage} contentFit="cover" />
          ) : (
            <View style={[styles.galleryImage, styles.placeholder]}>
              <Text style={styles.placeholderText}>No image</Text>
            </View>
          )}
          <View style={styles.badgeOverlay}>
            <ProductBadgeRow ids={product.badges} />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>
            K{Number(product.price).toLocaleString("en-ZM", { maximumFractionDigits: 0 })}
          </Text>

          <Pressable onPress={() => router.push(`/shop/${shopId}`)} style={styles.shopRow}>
            <Text style={styles.shopLabel}>Sold by </Text>
            <Text style={styles.shopName}>{shopName}</Text>
            <Text style={styles.shopChevron}> ›</Text>
          </Pressable>

          {product.rating != null ? (
            <Text style={styles.rating}>★ {Number(product.rating).toFixed(1)}</Text>
          ) : null}

          {product.description ? (
            <View style={styles.descBlock}>
              <Text style={styles.descTitle}>Description</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>
          ) : null}

          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyControls}>
              <Pressable
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                style={styles.qtyBtn}
                hitSlop={8}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable onPress={() => setQty((q) => q + 1)} style={styles.qtyBtn} hitSlop={8}>
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setChatOpen(true)}
              style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.chatBtnText}>Chat</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                // Buy now: add current qty then go to checkout
                if (!product) return;
                await addToCart(
                  {
                    id: product.id,
                    name: product.name,
                    shopName: product.shops?.name || "",
                    price: Number(product.price),
                    image_url: product.image_url,
                    shop_id: product.shop_id,
                  },
                  qty
                );
                router.push("/checkout");
              }}
              style={({ pressed }) => [styles.buyBtn, pressed && styles.addBtnPressed]}
            >
              <Text style={styles.buyBtnText}>Buy</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onAdd}
            disabled={adding}
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          >
            <Text style={styles.addBtnText}>{adding ? "Adding…" : "Add to cart"}</Text>
          </Pressable>
        </View>

        {similar.length > 0 ? (
          <View style={styles.similarBlock}>
            <Text style={styles.similarTitle}>Similar products</Text>
            <View style={styles.grid}>
              {similar.map((p) => (
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
          </View>
        ) : null}
      </ScrollView>


      <Modal visible={chatOpen} transparent animationType="fade" onRequestClose={() => setChatOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setChatOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.modalTitle}>Chat on WhatsApp</Text>
            <Text style={styles.modalBody}>
              Continue to WhatsApp to message the seller about this product.
            </Text>
            <Pressable
              style={styles.modalPrimary}
              onPress={async () => {
                const raw = product?.shops?.whatsapp_number || "";
                const digits = raw.replace(/\D/g, "");
                if (!digits) {
                  setChatOpen(false);
                  setToast("Seller has not set a WhatsApp number yet");
                  setTimeout(() => setToast(""), 2000);
                  return;
                }
                const msg = encodeURIComponent(
                  `Hi, I'm interested in "${product?.name}" (K${Number(product?.price || 0).toLocaleString()}) on Marketplace.`
                );
                const url = `https://wa.me/${digits}?text=${msg}`;
                setChatOpen(false);
                await Linking.openURL(url);
              }}
            >
              <Text style={styles.modalPrimaryText}>Open WhatsApp</Text>
            </Pressable>
            <Pressable onPress={() => setChatOpen(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
  },
  backBtn: { minWidth: 40, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.displaySemibold,
    fontSize: typography.h3,
    color: colors.text,
  },
  cartLink: { color: colors.primary, fontFamily: typography.bodySemibold, fontSize: typography.small },
  galleryWrap: { width: SCREEN_W, aspectRatio: 1, backgroundColor: "#F1F5F9", position: "relative" },
  galleryImage: { width: SCREEN_W, height: SCREEN_W },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.textFaint },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotOn: { backgroundColor: "#fff", width: 16 },
  badgeOverlay: { position: "absolute", top: 12, left: 12, right: 12 },
  body: { padding: spacing.lg, backgroundColor: colors.surface },
  name: {
    fontFamily: typography.displaySemibold,
    fontSize: typography.h2,
    color: colors.text,
    marginBottom: 8,
  },
  price: {
    fontFamily: typography.bodyBold,
    fontSize: 22,
    color: "#EA580C",
    marginBottom: 12,
  },
  shopRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  shopLabel: { color: colors.textMuted, fontSize: typography.small },
  shopName: { color: colors.primary, fontFamily: typography.bodySemibold, fontSize: typography.small },
  shopChevron: { color: colors.primary, fontSize: typography.small },
  rating: { color: colors.textSecondary, fontSize: typography.small, marginBottom: 12 },
  descBlock: {
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  descTitle: {
    fontFamily: typography.bodyBold,
    fontSize: typography.small,
    color: colors.text,
    marginBottom: 6,
  },
  descText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  qtyLabel: { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.body },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  qtyBtnText: { fontSize: 20, color: colors.text, lineHeight: 24 },
  qtyValue: {
    fontFamily: typography.bodyBold,
    fontSize: typography.h3,
    color: colors.text,
    minWidth: 28,
    textAlign: "center",
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnPressed: { backgroundColor: colors.primaryDark },
  addBtnText: { color: colors.onPrimary, fontFamily: typography.bodyBold, fontSize: typography.body },
  similarBlock: { padding: spacing.lg, paddingTop: spacing.xl },
  similarTitle: {
    fontFamily: typography.displaySemibold,
    fontSize: typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  notFoundText: {
    fontSize: typography.h3,
    fontFamily: typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  link: { color: colors.primary, fontFamily: typography.bodySemibold },
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
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  chatBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#ECFDF5",
  },
  chatBtnText: { color: "#128C7E", fontFamily: typography.bodyBold, fontSize: typography.body },
  buyBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  buyBtnText: { color: colors.onPrimary, fontFamily: typography.bodyBold, fontSize: typography.body },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 20,
  },
  modalTitle: {
    fontFamily: typography.displaySemibold,
    fontSize: typography.h3,
    color: colors.text,
    marginBottom: 8,
  },
  modalBody: { color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  modalPrimary: {
    backgroundColor: "#25D366",
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  modalPrimaryText: { color: "#fff", fontFamily: typography.bodyBold },
  modalCancel: { paddingVertical: 10, alignItems: "center" },
  modalCancelText: { color: colors.textMuted, fontFamily: typography.bodySemibold },
});
