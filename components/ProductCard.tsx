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
};

type Props = {
  product: ProductCardData;
  variant?: "home" | "shop";
  onAddToCart?: (product: ProductCardData) => void;
};

function CartIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="9" cy="20" r="1.4" />
      <Circle cx="18" cy="20" r="1.4" />
      <Path d="M2 3h2l2.4 12.6a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6" />
    </Svg>
  );
}

export function ProductCard({ product, variant = "home", onAddToCart }: Props) {
  const isShop = variant === "shop";

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  const handleAdd = (e: any) => {
    e?.stopPropagation?.();
    onAddToCart?.(product);
  };

  const rating = product.rating != null ? product.rating : 4.7;

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
          <ProductBadgeRow ids={product.badges} />
        </View>

        <Pressable onPress={handleAdd} style={styles.cartIconBtn} hitSlop={8}>
          <CartIcon size={15} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.rating}>{rating.toFixed(1)}</Text>
          {product.shop_name ? (
            <Text style={styles.shopMini} numberOfLines={1}>
              {product.shop_name}
            </Text>
          ) : null}
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            K{Number(product.price).toLocaleString("en-ZM", { maximumFractionDigits: 0 })}
          </Text>
          {product.sold_count != null && product.sold_count > 0 ? (
            <Text style={styles.sold}>{formatSold(product.sold_count)} sold</Text>
          ) : null}
        </View>

        {isShop ? (
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          >
            <CartIcon size={14} color="#fff" />
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function formatSold(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  return `${n}+`;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  cardPressed: { opacity: 0.92 },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: "#F1F5F9",
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
    right: 40,
  },
  cartIconBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { padding: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 3 },
  star: { color: "#F59E0B", fontSize: 11 },
  rating: { fontSize: 11, fontFamily: typography.bodySemibold, color: colors.text },
  shopMini: { flex: 1, fontSize: 10, color: colors.textFaint, marginLeft: 4 },
  name: {
    fontSize: 12,
    fontFamily: typography.bodyMedium,
    color: colors.text,
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 4,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  price: {
    fontSize: 16,
    fontFamily: typography.bodyBold,
    color: "#EA580C",
  },
  sold: { fontSize: 10, color: colors.textMuted, fontFamily: typography.bodyMedium },
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
  addBtnText: { color: "#fff", fontSize: typography.small, fontFamily: typography.bodySemibold },
});
