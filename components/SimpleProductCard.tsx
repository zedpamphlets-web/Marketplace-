import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { colors, radius, typography } from "@/lib/theme";

export type SimpleProduct = {
  id: string;
  shop_id?: string;
  name: string;
  price: number;
  /** Optional original/list price — shown crossed out when higher than price */
  original_price?: number | null;
  image_url?: string | null;
};

type Props = {
  product: SimpleProduct;
  /** Card width; default fills half-row (~48%) via parent */
  width?: number | string;
  onAddToCart?: (product: SimpleProduct) => void;
};

function MiniCartIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
      <Circle cx="9" cy="20" r="1.4" />
      <Circle cx="18" cy="20" r="1.4" />
      <Path d="M2 3h2l2.4 12.6a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Flat marketplace-style card: large image, bold price, optional struck original,
 * one-line name, small cart icon. No border / shadow (unlike ProductCard).
 */
export function SimpleProductCard({ product, width = "48%", onAddToCart }: Props) {
  const hasDiscount =
    product.original_price != null &&
    Number(product.original_price) > Number(product.price);

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}`)}
      style={({ pressed }) => [styles.card, { width: width as any }, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.placeholder} />
        )}
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            onAddToCart?.(product);
          }}
          style={styles.cartBtn}
          hitSlop={6}
        >
          <MiniCartIcon />
        </Pressable>
      </View>

      <View style={styles.meta}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            K{Number(product.price).toLocaleString("en-ZM", { maximumFractionDigits: 0 })}
          </Text>
          {hasDiscount ? (
            <Text style={styles.original}>
              K{Number(product.original_price).toLocaleString("en-ZM", { maximumFractionDigits: 0 })}
            </Text>
          ) : null}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  pressed: { opacity: 0.92 },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: radius.sm,
    overflow: "hidden",
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  placeholder: { flex: 1, backgroundColor: "#E2E8F0" },
  cartBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { paddingTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 2 },
  price: {
    fontFamily: typography.bodyBold,
    fontSize: typography.body,
    color: colors.text,
  },
  original: {
    fontSize: typography.tiny,
    color: colors.textFaint,
    textDecorationLine: "line-through",
  },
  name: {
    fontSize: typography.small,
    color: colors.textSecondary,
    fontFamily: typography.bodyMedium,
  },
});
