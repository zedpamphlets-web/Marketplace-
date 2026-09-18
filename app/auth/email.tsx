import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { useSupportEmail } from "@/lib/appSettings";
import { PrimaryButton } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { acceptPendingShopInvite } from "@/lib/adminActions";
import { resolveDestination } from "@/lib/authFlow";

export default function EmailAuth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supportEmail = useSupportEmail();

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) throw loginError;
      }
      await acceptPendingShopInvite();
      const dest = await resolveDestination();
      router.replace(dest as any);
    } catch (e: any) {
      setError(e.message || "Could not continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{mode === "login" ? "Sign in with email" : "Create account"}</Text>

        {mode === "signup" && (
          <>
            <Text style={styles.label}>Full name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label={mode === "login" ? "Sign in" : "Sign up"} onPress={submit} loading={loading} />
        </View>
        <Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")} style={{ marginTop: 16 }}>
          <Text style={styles.link}>
            {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </Text>
        </Pressable>
        {supportEmail ? (
          <>
            <Text style={{ textAlign: "center", color: colors.textMuted, marginTop: 24 }}>Need help? Email us</Text>
            <Text style={{ textAlign: "center", color: colors.primary, fontFamily: typography.bodySemibold, marginTop: 4 }}>{supportEmail}</Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  back: { paddingHorizontal: 16, paddingVertical: 10 },
  backText: { color: colors.text, fontFamily: typography.bodySemibold },
  content: { padding: 20 },
  title: { fontSize: 22, fontFamily: typography.displayFont, marginBottom: 16, color: colors.text },
  label: { fontFamily: typography.bodySemibold, marginBottom: 6, marginTop: 10, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  error: { color: colors.danger, marginTop: 10 },
  link: { textAlign: "center", color: colors.primary, fontFamily: typography.bodySemibold },
});
