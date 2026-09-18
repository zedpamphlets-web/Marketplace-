import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, typography } from "@/lib/theme";
import { supabase } from "@/lib/supabase";

export default function LegalPage() {
  const [text, setText] = useState("");

  useEffect(() => {
    supabase
      .from("settings")
      .select("content")
      .eq("id", "global")
      .maybeSingle()
      .then(({ data }) => {
        const content = (data?.content ?? {}) as any;
        setText(content.legal_terms || "Legal terms will appear here once the admin adds them.");
      });
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Legal terms & policies</Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.text}>{text}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { fontSize: 28, color: colors.text },
  title: { fontFamily: typography.displaySemibold, fontSize: 16 },
  body: { padding: 16 },
  text: { color: colors.text, lineHeight: 22, fontSize: 15 },
});
