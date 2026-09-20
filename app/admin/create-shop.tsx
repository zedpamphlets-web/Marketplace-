import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { pickImageFromPhone, uploadImageFromUri } from "@/lib/uploadImage";

export default function CreateShop() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [localLogo, setLocalLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const pickLogo = async () => {
    const picked = await pickImageFromPhone("icon");
    if (picked.error) {
      setMessage(picked.error);
      return;
    }
    if (picked.uri) setLocalLogo(picked.uri);
  };

  const save = async () => {
    setMessage("");
    if (!name.trim()) {
      setMessage("Shop name is required.");
      return;
    }
    setSaving(true);

    let logo_url: string | null = null;
    if (localLogo) {
      const up = await uploadImageFromUri(localLogo, "shops", `logo-${Date.now()}.jpg`);
      if (up.error) {
        setSaving(false);
        setMessage(up.error);
        return;
      }
      logo_url = up.url;
    }

    const { data, error } = await supabase
      .from("shops")
      .insert({
        name: name.trim(),
        category: category.trim() || null,
        logo_url,
        setup_complete: true,
        is_open: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      setSaving(false);
      setMessage(error?.message || "Could not create shop.");
      return;
    }

    if (email.trim()) {
      const { error: inviteError } = await supabase.from("shop_invites").insert({
        shop_id: data.id,
        email: email.trim().toLowerCase(),
        accepted: false,
      });
      if (inviteError) {
        setSaving(false);
        setMessage(`Shop created, but invite failed: ${inviteError.message}`);
        return;
      }
    }

    setSaving(false);
    setMessage(
      email.trim()
        ? "Shop created. Invited admin must sign up / log in with that email."
        : "Shop created."
    );
    setTimeout(() => router.replace("/admin/shops"), 900);
  };

  return (
    <AdminShell title="Create Shop">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Shop name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Lusaka Styles"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Fashion"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.label}>Shop logo (from phone)</Text>
        <Pressable style={styles.pickBtn} onPress={pickLogo}>
          {localLogo ? (
            <Image source={{ uri: localLogo }} style={styles.preview} contentFit="cover" />
          ) : (
            <Text style={styles.pickText}>Choose logo from gallery</Text>
          )}
        </Pressable>
        {localLogo ? (
          <Pressable onPress={() => setLocalLogo(null)}>
            <Text style={styles.clear}>Remove logo</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Invite shop admin (email)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="shopowner@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.hint}>
          They sign up or log in with this email. On login the app links them as shop admin
          automatically.
        </Text>

        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Create shop" onPress={save} loading={saving} />
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  label: {
    fontFamily: typography.bodySemibold,
    marginBottom: 6,
    marginTop: spacing.md,
    color: colors.adminText,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.adminCard,
    color: colors.adminText,
  },
  pickBtn: {
    height: 100,
    width: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.adminCard,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  pickText: {
    color: colors.primary,
    fontFamily: typography.bodySemibold,
    fontSize: typography.tiny,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  preview: { width: "100%", height: "100%" },
  clear: { color: colors.danger, fontFamily: typography.bodySemibold, marginBottom: 8 },
  hint: { color: colors.adminMuted, fontSize: typography.small, marginVertical: spacing.md },
  msg: { color: colors.primary, marginBottom: spacing.md },
});
