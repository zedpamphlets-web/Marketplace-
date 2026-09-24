import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors, typography } from "@/lib/theme";

export function BagLogo({ size = 44, color = colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path d="M4 26h12" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M4 33h8" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M4 40h12" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      <Path
        d="M22 24h28l3 28H19l3-28z"
        fill={color}
      />
      <Path
        d="M30 24c0-6 3.2-10 8-10s8 4 8 10"
        stroke={color}
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
      />
      <Rect x="31" y="34" width="12" height="9" rx="2" fill="#111111" opacity={0.18} />
    </Svg>
  );
}

export function ShopTroryWordmark({
  size = 28,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  const shop = light ? "#FFFFFF" : colors.text;
  return (
    <Text style={{ fontSize: size, fontFamily: typography.displayFont, letterSpacing: -0.6 }}>
      <Text style={{ color: shop }}>Shop</Text>
      <Text style={{ color: colors.primary }}>Trory</Text>
    </Text>
  );
}

export function BrandLockup({ size = 44 }: { size?: number }) {
  return (
    <View style={styles.lockup}>
      <BagLogo size={size} />
      <View>
        <ShopTroryWordmark size={Math.round(size * 0.62)} />
        <Text style={styles.tag}>Shop Smarter · Live Better</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { alignItems: "center", gap: 8 },
  tag: {
    marginTop: 2,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: typography.bodyMedium,
  },
});
