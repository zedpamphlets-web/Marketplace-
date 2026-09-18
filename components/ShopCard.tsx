import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "@/lib/theme";

export type ShopCardData = {
  id: string;
  name: string;
  logo_url: string | null;
  category?: string | null;
  rating?: number | null;
  is_open?: boolean;
};

const CARD_WIDTH = 132;

export function ShopCard({ shop }: { shop: ShopCardData }) {
  return (
    <Pressable
      onPress={() => router.push(`/shop/${shop.id}`)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View style={[styles.thumb, shadow.card]}>
        {shop.logo_url ? (
          <Image source={{ uri: shop.logo_url }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.initials}>
              {shop.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </Text>
          </View>
        )}
        {shop.is_open === false ? (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>Closed</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {shop.name}
      </Text>
      {shop.category ? (
        <Text style={styles.category} numberOfLines={1}>
          {shop.category}
        </Text>
      ) : null}
      <View style={styles.meta}>
        <Text style={styles.rating}>★ {(shop.rating ?? 5).toFixed(1)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  thumb: {
    width: CARD_WIDTH,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    overflow: "hidden",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontSize: 20,
    fontFamily: typography.displayFont,
    letterSpacing: 0.5,
  },
  closedBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  closedText: {
    color: "#fff",
    fontSize: typography.micro,
    fontFamily: typography.bodySemibold,
  },
  name: {
    fontSize: typography.small,
    fontFamily: typography.bodySemibold,
    color: colors.text,
  },
  category: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    fontFamily: typography.bodyMedium,
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  rating: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
    fontFamily: typography.bodyMedium,
  },
});
