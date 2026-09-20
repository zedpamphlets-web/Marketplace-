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
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";

export default function PromotionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: banner } = await supabase
        .from("banners")
        .select("title, subtitle, image_url")
        .eq("id", id)
        .maybeSingle();
      setTitle(banner?.title || "Promotion");
      setSubtitle(banner?.subtitle ?? null);
      setImageUrl(banner?.image_url ?? null);

      const { data: links } = await supabase
        .from("banner_products")
        .select("product_id")
        .eq("banner_id", id);
      const ids = (links ?? []).map((l: any) => l.product_id);
      if (ids.length === 0) {
        setProducts([]);
        return;
      }
      const { data: rows } = await supabase
        .from("products")
        .select("id, shop_id, name, price, image_url, rating, is_deal, category, badges, sold_count, shops(name)")
        .in("id", ids);
      setProducts(
        (rows ?? []).map((p: any) => ({
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
    } catch (e) {
      console.warn(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
            <Path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.hero} contentFit="cover" />
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : products.length === 0 ? (
          <Text style={styles.empty}>No products linked to this promotion yet.</Text>
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
  backBtn: { width: 40, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.displaySemibold,
    fontSize: typography.h3,
    color: colors.text,
  },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hero: { width: "100%", height: 160, borderRadius: radius.lg, marginBottom: spacing.md },
  title: {
    fontFamily: typography.displaySemibold,
    fontSize: typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: { color: colors.textMuted, marginBottom: spacing.lg, fontSize: typography.body },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32 },
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
