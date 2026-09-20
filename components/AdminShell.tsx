import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors, spacing, typography } from "@/lib/theme";
import { AppMenu } from "@/components/AppMenu";

function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.adminText} strokeWidth={2}>
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AdminShell({
  title,
  children,
  showBack = true,
  onNotificationPress,
}: {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  onNotificationPress?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      <View style={styles.topRow}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.iconBtn} hitSlop={10}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.adminText} strokeWidth={2}>
            <Path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.rightActions}>
          <Pressable
            onPress={onNotificationPress || (() => {})}
            style={styles.iconBtn}
            hitSlop={10}
          >
            <BellIcon />
          </Pressable>
          {showBack ? (
            <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.adminBg },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.adminSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    minWidth: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 44,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.h3,
    fontFamily: typography.displaySemibold,
    color: colors.adminText,
  },
  backText: {
    color: colors.primary,
    fontFamily: typography.bodySemibold,
    fontSize: typography.small,
  },
});
