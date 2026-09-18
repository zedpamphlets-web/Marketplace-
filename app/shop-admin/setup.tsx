// app/shop-admin/setup.tsx
// First-login setup for a newly invited shop admin. Completing this is
// what makes the shop appear on the customer-facing "Featured Shops" row —
// see supabase/schema.sql: the home query only shows shops where
// setup_complete = true.

import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { PrimaryButton } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { useUserRole } from "@/lib/useUserRole";

export default function ShopAdminSetupScreen() {
  const role = useUserRole();
  const [shopName, setShopName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [banner1, setBanner1] = useState<string | null>(null);
  const [banner2, setBanner2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (role.type !== "shop_admin") return;
    setError("");
    if (!shopName.trim()) {
      setError("Please enter your shop name.");
      return;
    }
    setLoading(true);
    try {
      // TODO: upload logoUri/banner1/banner2 to Supabase Storage first,
      // then save the resulting public URLs here.
      const { error: updateError } = await supabase
        .from("shops")
        .update({
          name: shopName,
          logo_url: logoUri,
          banner_1: banner1,
          banner_2: banner2,
          setup_complete: true,
        })
        .eq("id", role.shopId);

      if (updateError) throw updateError;
      router.replace("/shop-admin");
    } catch (e: any) {
      setError(e.message || "Could not save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Set up your shop</Text>
        <Text style={styles.subtitle}>This is what customers will see on the marketplace.</Text>

        <Text style={styles.label}>Shop name</Text>
        <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="e.g. Mwana Fresh Grocers" />

        <Text style={styles.label}>Logo</Text>
        <Pressable style={[styles.uploadBox, shadow.card]} onPress={() => {/* TODO: expo-image-picker */}}>
          <Text style={styles.uploadText}>{logoUri ? "Logo selected" : "Tap to add logo"}</Text>
        </Pressable>

        <Text style={styles.label}>Banner 1</Text>
        <Pressable style={[styles.uploadBox, shadow.card]} onPress={() => {/* TODO: expo-image-picker */}}>
          <Text style={styles.uploadText}>{banner1 ? "Banner selected" : "Tap to add banner"}</Text>
        </Pressable>

        <Text style={styles.label}>Banner 2</Text>
        <Pressable style={[styles.uploadBox, shadow.card]} onPress={() => {/* TODO: expo-image-picker */}}>
          <Text style={styles.uploadText}>{banner2 ? "Banner selected" : "Tap to add banner"}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton label="Save and continue" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: { fontSize: typography.h1, fontFamily: typography.displayFont, color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  label: { fontSize: typography.small, fontFamily: typography.bodySemibold, color: colors.text, marginBottom: 6, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: typography.body, backgroundColor: colors.surface },
  uploadBox: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", padding: spacing.xl, alignItems: "center" },
  uploadText: { color: colors.textMuted, fontSize: typography.small },
  error: { color: colors.danger, fontSize: typography.small, marginTop: spacing.md },
});
