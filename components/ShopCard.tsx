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

        {/* Name + rating overlaid on the image */}
        <View style={styles.caption}>
          <Text style={styles.name} numberOfLines={1}>
            {shop.name}
          </Text>
          <Text style={styles.rating}>★ {(shop.rating ?? 5).toFixed(1)}</Text>
        </View>
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
    height: 110,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    overflow: "hidden",
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
    fontSize: 22,
    fontFamily: typography.displayFont,
    letterSpacing: 0.5,
  },
  closedBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  closedText: {
    color: "#fff",
    fontSize: typography.micro,
    fontFamily: typography.bodySemibold,
  },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  name: {
    fontSize: typography.small,
    fontFamily: typography.bodySemibold,
    color: "#FFFFFF",
  },
  rating: {
    fontSize: typography.tiny,
    color: "rgba(255,255,255,0.9)",
    fontFamily: typography.bodyMedium,
    marginTop: 1,
  },
});
