import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { colors, typography } from "@/lib/theme";
import { supabase } from "@/lib/supabase";

export function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("categories").select("id, name").order("sort_order");
      setItems((data as any[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />;
  }

  if (!items.length) {
    return <Text style={styles.empty}>Add categories in Admin → Categories</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((c) => {
        const on = value === c.name;
        return (
          <Pressable key={c.id} onPress={() => onChange(c.name)} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {c.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 200,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  label: { fontSize: 12, color: colors.textMuted, maxWidth: 160 },
  labelOn: { color: colors.text, fontFamily: typography.bodySemibold },
  empty: { color: colors.textMuted, fontSize: 12, marginBottom: 8 },
});
