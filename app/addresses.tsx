import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { colors, radius, spacing, typography } from "@/lib/theme";
import { PrimaryButton, EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";

type Address = {
  id: string;
  full_name: string;
  phone: string;
  plot: string;
  area: string;
  district: string;
};

export default function AddressesScreen() {
  const [items, setItems] = useState<Address[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [plot, setPlot] = useState("");
  const [area, setArea] = useState("");
  const [district, setDistrict] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setItems([]);
      return;
    }
    const { data } = await supabase
      .from("addresses")
      .select("id, full_name, phone, plot, area, district")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });
    setItems((data as Address[]) ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const save = async () => {
    setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push("/auth/login");
      return;
    }
    if (!fullName.trim() || !phone.trim() || !plot.trim() || !area.trim() || !district.trim()) {
      setMessage("Fill in name, phone, plot, area and district.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("addresses").insert({
      user_id: auth.user.id,
      full_name: fullName.trim(),
      phone: phone.trim(),
      plot: plot.trim(),
      area: area.trim(),
      district: district.trim(),
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setFullName("");
    setPhone("");
    setPlot("");
    setArea("");
    setDistrict("");
    load();
  };

  const remove = (id: string) => {
    Alert.alert("Remove address?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await supabase.from("addresses").delete().eq("id", id);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Addresses</Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
        <Text style={styles.label}>Phone number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={styles.label}>Plot</Text>
        <TextInput style={styles.input} value={plot} onChangeText={setPlot} />
        <Text style={styles.label}>Area</Text>
        <TextInput style={styles.input} value={area} onChangeText={setArea} />
        <Text style={styles.label}>District</Text>
        <TextInput style={styles.input} value={district} onChangeText={setDistrict} />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Save address" onPress={save} loading={saving} />

        <Text style={styles.heading}>Saved</Text>
        {items.length === 0 ? (
          <EmptyState title="No addresses yet" />
        ) : (
          items.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.full_name}</Text>
                <Text style={styles.meta}>{a.phone}</Text>
                <Text style={styles.meta}>
                  Plot {a.plot}, {a.area}, {a.district}
                </Text>
              </View>
              <Pressable onPress={() => remove(a.id)}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
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
  title: { fontFamily: typography.displaySemibold, fontSize: 18 },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontFamily: typography.bodySemibold, marginTop: 10, marginBottom: 6, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  msg: { color: colors.danger, marginVertical: 8 },
  heading: { marginTop: 22, marginBottom: 8, fontFamily: typography.displaySemibold, color: colors.text },
  card: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 8,
  },
  name: { fontFamily: typography.bodySemibold, color: colors.text },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  remove: { color: colors.danger, fontFamily: typography.bodySemibold },
});
