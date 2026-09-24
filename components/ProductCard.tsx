import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { colors, radius, spacing, typography, shadow } from "@/lib/theme";
import { ProductBadgeRow } from "@/components/ProductBadges";

export type ProductCardData = {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  image_url: string | null;
  rating?: number;
  is_deal?: boolean;
  category?: string | null;
  sold_count?: number | null;
  shop_name?: string | null;
  badges?: string[] | null;
  original_price?: number | null;
};

type Props = {
  product: ProductCardData;
  variant?: "home" | "shop";
  onAddToCart?: (product: ProductCardData) => void;
};

function CartIcon({ size = 16, color = colors.onPrimary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="9" cy="20" r="1.4" />
      <Circle cx="18" cy="20" r="1.4" />
      <Path d="M2 3h2l2.4 12.6a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6" />
    </Svg>
  );
}

function formatSold(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  return `${n}`;
}

export function ProductCard({ product, variant = "home", onAddToCart }: Props) {
  const isShop = variant === "shop";
  const orig = product.original_price != null ? Number(product.original_price) : null;
  const price = Number(product.price);
  const discount =
    orig != null && orig > price ? Math.round(((orig - price) / orig) * 100) : product.is_deal ? 10 : 0;
  const verified = (product.badges || []).some((b) => String(b).toLowerCase().includes("verified"));

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  const handleAdd = (e: any) => {
    e?.stopPropagation?.();
    onAddToCart?.(product);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, shadow.card, pressed && styles.cardPressed]}
    >
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderLabel}>No image</Text>
          </View>
        )}

        <View style={styles.badgeOverlay}>
          {product.is_deal ? (
            <View style={styles.superPill}>
              <Text style={styles.superText}>Super</Text>
            </View>
          ) : null}
          <ProductBadgeRow ids={product.badges} />
        </View>

        <View style={styles.cam}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2}>
            <Path d="M4 8h3l2-2h6l2 2h3v11H4V8z" />
            <Circle cx="12" cy="13" r="3.2" />
          </Svg>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            K{price.toLocaleString("en-ZM", { maximumFractionDigits: 0 })}
          </Text>
          {discount > 0 ? (
            <Text style={styles.off}>↓ {discount}% off</Text>
          ) : null}
        </View>

        <Text style={styles.metaLine} numberOfLines={1}>
          MOQ: 1
          {verified ? "   Verified" : ""}
          {product.shop_name ? ` · ${product.shop_name}` : ""}
        </Text>

        {product.sold_count != null && product.sold_count > 0 ? (
          <Text style={styles.sold}>{formatSold(product.sold_count)} sold</Text>
        ) : null}

        {product.is_deal || discount >= 10 ? (
          <Text style={styles.lowest}>↓ 180-day lowest prices</Text>
        ) : null}

        {isShop ? (
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          >
            <CartIcon size={14} color={colors.onPrimary} />
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.92 },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: "#F6F3EA",
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderLabel: {
    fontSize: typography.tiny,
    color: colors.textFaint,
    fontFamily: typography.bodyMedium,
  },
  badgeOverlay: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 28,
    gap: 4,
  },
  superPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  superText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontFamily: typography.bodyBold,
  },
  cam: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 10 },
  name: {
    fontSize: 13,
    fontFamily: typography.bodyMedium,
    color: colors.text,
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 4,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" },
  price: {
    fontSize: 16,
    fontFamily: typography.bodyBold,
    color: colors.text,
  },
  off: { fontSize: 11, color: "#DC2626", fontFamily: typography.bodySemibold },
  metaLine: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: typography.bodyMedium,
  },
  sold: { marginTop: 2, fontSize: 11, color: colors.textMuted },
  lowest: {
    marginTop: 3,
    fontSize: 11,
    color: "#DC2626",
    fontFamily: typography.bodyMedium,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 10,
    marginTop: 8,
  },
  addBtnPressed: { backgroundColor: colors.primaryDark },
  addBtnText: { color: colors.onPrimary, fontSize: typography.small, fontFamily: typography.bodySemibold },
});
