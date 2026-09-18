import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, typography } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { CATALOG_CATEGORIES } from "@/lib/categories";
import { resolveDestination } from "@/lib/authFlow";

function firstNameFromUser(user: any) {
  const meta = user?.user_metadata || {};
  const raw = meta.full_name || meta.name || user?.email || "there";
  return String(raw).split(" ")[0];
}

function initialFrom(name: string) {
  return (name[0] || "U").toUpperCase();
}

export default function Onboarding() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [name, setName] = useState("there");
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setName(firstNameFromUser(data.user));
    });
  }, []);

  const suggestions = useMemo(() => {
    const base = picked || "Apparel & Accessories";
    return [
      `${base} near me`,
      `Best ${base}`,
      `New in ${base}`,
    ];
  }, [picked]);

  const finish = async (skip = false) => {
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (user) {
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: firstNameFromUser(user),
        purpose: skip ? "personal" : "personal",
        favorite_categories: picked ? [picked] : [],
        onboarding_complete: true,
      });
    }
    const dest = await resolveDestination(true);
    router.replace(dest as any);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.topRow}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((s) => (s === 0 ? 0 : ((s - 1) as any)))}>
                <Text style={styles.topLink}>‹</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable onPress={() => finish(true)}>
              <Text style={styles.topLink}>Skip</Text>
            </Pressable>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialFrom(name)}</Text>
          </View>
          {step === 0 && (
            <>
              <Text style={styles.hello}>Hello, {name}.</Text>
              <Text style={styles.hello}>Welcome.</Text>
            </>
          )}
          {step === 1 && <Text style={styles.hello}>Let’s set up your shopping.</Text>}
          {step === 2 && <Text style={styles.hello}>Pick what you want to browse.</Text>}
          {step === 3 && <Text style={styles.hello}>You’re all set.</Text>}
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        {step === 0 && (
          <Pressable style={styles.next} onPress={() => setStep(1)}>
            <Text style={styles.nextText}>Continue</Text>
          </Pressable>
        )}

        {step === 1 && (
          <>
            <Text style={styles.step}>1/3</Text>
            <Text style={styles.q}>What are you here for?</Text>
            <Pressable style={[styles.choice, styles.choiceOn]}>
              <Text style={styles.choiceIcon}>🛍️</Text>
              <Text style={styles.choiceText}>Personal purchases</Text>
            </Pressable>
            <Text style={styles.hint}>You can change this later.</Text>
            <Pressable style={styles.next} onPress={() => setStep(2)}>
              <Text style={styles.nextText}>Next</Text>
            </Pressable>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.step}>2/3</Text>
            <Text style={styles.q}>Pick a product category</Text>
            <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
              {CATALOG_CATEGORIES.map((c) => {
                const on = picked === c.name;
                return (
                  <Pressable key={c.name} onPress={() => setPicked(c.name)} style={[styles.cat, on && styles.catOn]}>
                    <Text style={styles.catIcon}>{c.icon}</Text>
                    <Text style={styles.catName}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={[styles.next, !picked && styles.nextOff]} disabled={!picked} onPress={() => setStep(3)}>
              <Text style={styles.nextText}>Next</Text>
            </Pressable>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.step}>3/3</Text>
            <Text style={styles.q}>Start with your first search</Text>
            {suggestions.map((s) => (
              <View key={s} style={styles.suggest}>
                <Text style={styles.suggestText}>{s}</Text>
              </View>
            ))}
            <Pressable style={styles.next} onPress={() => finish(false)} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Start shopping</Text>}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF7ED" },
  hero: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingBottom: 28 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topLink: { color: "#fff", fontSize: 16, fontFamily: typography.bodySemibold },
  avatar: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 12,
  },
  avatarText: { color: colors.accent, fontSize: 28, fontFamily: typography.displayFont },
  hello: { color: "#fff", textAlign: "center", fontSize: 18, fontFamily: typography.bodySemibold },
  body: { flex: 1, padding: 20 },
  step: { color: colors.textFaint, marginBottom: 6 },
  q: { fontSize: 20, fontFamily: typography.displaySemibold, color: colors.text, marginBottom: 14 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  choiceOn: {},
  choiceIcon: { fontSize: 20 },
  choiceText: { fontFamily: typography.bodySemibold, color: colors.text, fontSize: 16 },
  hint: { color: colors.textMuted, marginTop: 10, marginBottom: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingBottom: 16 },
  cat: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 78,
  },
  catOn: { borderColor: colors.accent, borderWidth: 2 },
  catIcon: { fontSize: 22, marginBottom: 6 },
  catName: { fontSize: 12, color: colors.text, fontFamily: typography.bodyMedium },
  suggest: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10 },
  suggestText: { color: colors.text },
  next: {
    backgroundColor: colors.accent,
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  nextOff: { opacity: 0.45 },
  nextText: { color: "#fff", fontFamily: typography.bodyBold, fontSize: 16 },
});
