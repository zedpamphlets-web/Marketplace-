import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, typography } from "@/lib/theme";
import { supabase } from "@/lib/supabase";

const LANG_KEY = "mall_language";

export default function SettingsScreen() {
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => {
      if (v) setLanguage(v);
    });
  }, []);

  const pickLanguage = () => {
    Alert.alert("Language", "Choose a language", [
      { text: "English", onPress: () => saveLang("English") },
      { text: "Bemba", onPress: () => saveLang("Bemba") },
      { text: "Nyanja", onPress: () => saveLang("Nyanja") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const saveLang = async (v: string) => {
    setLanguage(v);
    await AsyncStorage.setItem(LANG_KEY, v);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        language: v,
        updated_at: new Date().toISOString(),
      });
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView>
        <Pressable style={styles.row} onPress={() => Alert.alert("Country & region", "Zambia")}>
          <Text style={styles.label}>Country & region</Text>
          <Text style={styles.value}>Zambia ›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={pickLanguage}>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>{language} ›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => Alert.alert("Notifications", "Order updates will appear here.")}>
          <Text style={styles.label}>Notifications</Text>
          <Text style={styles.value}>›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push("/pages/about")}>
          <Text style={styles.label}>About this app</Text>
          <Text style={styles.value}>›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push("/pages/legal")}>
          <Text style={styles.label}>Legal terms & policies</Text>
          <Text style={styles.value}>›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => Alert.alert("Share", "Available when the app is published.")}>
          <Text style={styles.label}>Share this app</Text>
          <Text style={styles.value}>›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push("/auth/login")}>
          <Text style={styles.label}>Switch accounts</Text>
          <Text style={styles.value}>›</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace("/auth/login");
          }}
        >
          <Text style={styles.label}>Sign out</Text>
        </Pressable>
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
  back: { fontSize: 28, color: colors.text, lineHeight: 30 },
  title: { fontFamily: typography.displaySemibold, fontSize: 18, color: colors.text },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.text, fontSize: 15 },
  value: { color: colors.textMuted },
});
