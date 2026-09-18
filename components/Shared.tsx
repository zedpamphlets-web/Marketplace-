import React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { colors, radius, spacing, typography } from "@/lib/theme";

export function SectionHeader({
  title,
  actionLabel,
  onPressAction,
}: {
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onPressAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && !loading && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.btnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIconText}>○</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Skeleton({
  width,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: radius.sm,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontFamily: typography.displaySemibold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: typography.small,
    fontFamily: typography.bodySemibold,
    color: colors.primary,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    backgroundColor: colors.primaryDark,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    color: "#fff",
    fontSize: typography.body,
    fontFamily: typography.bodyBold,
    letterSpacing: 0.2,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyIconText: {
    color: colors.textFaint,
    fontSize: 18,
  },
  emptyTitle: {
    fontSize: typography.h3,
    fontFamily: typography.bodySemibold,
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: typography.small,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
