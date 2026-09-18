import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PRODUCT_BADGES, badgesFromIds, type ProductBadgeId } from "@/lib/badges";
import { radius, typography } from "@/lib/theme";

export function ProductBadgeRow({
  ids,
  compact = true,
}: {
  ids?: string[] | null;
  compact?: boolean;
}) {
  const badges = badgesFromIds(ids).slice(0, compact ? 3 : 10);
  if (!badges.length) return null;
  return (
    <View style={styles.row} pointerEvents="none">
      {badges.map((b) => (
        <View key={b.id} style={[styles.pill, { backgroundColor: b.bg }]}>
          <Text style={[styles.icon, { color: b.fg }]}>{b.icon}</Text>
          <Text style={[styles.label, { color: b.fg }]} numberOfLines={1}>
            {b.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function BadgePicker({
  value,
  onChange,
  dark,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  dark?: boolean;
}) {
  const toggle = (id: ProductBadgeId) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <View style={styles.picker}>
      {PRODUCT_BADGES.map((b) => {
        const on = value.includes(b.id);
        return (
          <Pressable
            key={b.id}
            onPress={() => toggle(b.id)}
            style={[
              styles.option,
              { backgroundColor: on ? b.bg : dark ? "#1F2937" : "#F1F5F9" },
              !on && { borderColor: dark ? "#334155" : "#E2E8F0", borderWidth: 1 },
            ]}
          >
            <Text style={[styles.optionIcon, { color: on ? b.fg : "#94A3B8" }]}>{b.icon}</Text>
            <Text style={[styles.optionLabel, { color: on ? b.fg : dark ? "#E2E8F0" : "#334155" }]}>
              {b.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    maxWidth: "100%",
  },
  icon: { fontSize: 8, lineHeight: 11 },
  label: {
    fontSize: 8,
    lineHeight: 11,
    fontFamily: typography.bodyBold,
    letterSpacing: 0.2,
  },
  picker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  optionIcon: { fontSize: 11 },
  optionLabel: { fontSize: 11, fontFamily: typography.bodySemibold },
});
