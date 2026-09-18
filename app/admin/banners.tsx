import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton, EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { pickImageFromPhone, uploadImageFromUri } from "@/lib/uploadImage";

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  is_active: boolean;
};

export default function AdminBanners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("id, title, subtitle, image_url, is_active")
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    setItems((data as Banner[]) ?? []);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const pick = async () => {
    const picked = await pickImageFromPhone("banner");
    if (picked.error) {
      setMessage(picked.error);
      return;
    }
    if (picked.uri) setLocalImage(picked.uri);
  };

  const save = async () => {
    setMessage("");
    if (!title.trim() && !localImage) {
      setMessage("Add a title or pick an image from your phone.");
      return;
    }
    setSaving(true);
    let image_url: string | null = null;
    if (localImage) {
      const up = await uploadImageFromUri(localImage, "banners", `banner-${Date.now()}.jpg`);
      if (up.error) {
        setSaving(false);
        setMessage(up.error);
        return;
      }
      image_url = up.url;
    }
    const { error } = await supabase.from("banners").insert({
      title: title.trim() || "Offer",
      subtitle: subtitle.trim() || null,
      image_url,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setTitle("");
    setSubtitle("");
    setLocalImage(null);
    setMessage("Banner is live on Home.");
    load();
  };

  const toggle = async (b: Banner) => {
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
    load();
  };

  return (
    <AdminShell title="Banners">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Up to 20% off" placeholderTextColor={colors.adminMuted} />
        <Text style={styles.label}>Subtitle</Text>
        <TextInput style={styles.input} value={subtitle} onChangeText={setSubtitle} placeholder="Limited time · Shop now" placeholderTextColor={colors.adminMuted} />
        <Text style={styles.label}>Banner image (from phone)</Text>
        <Pressable style={styles.pickBtn} onPress={pick}>
          {localImage ? (
            <Image source={{ uri: localImage }} style={styles.preview} contentFit="cover" />
          ) : (
            <Text style={styles.pickText}>Choose image from gallery</Text>
          )}
        </Pressable>
        {localImage ? (
          <Pressable onPress={() => setLocalImage(null)}>
            <Text style={styles.clear}>Remove image</Text>
          </Pressable>
        ) : null}
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Post banner" onPress={save} loading={saving} />

        <Text style={styles.heading}>Live banners</Text>
        {items.length === 0 ? (
          <EmptyState title="No banners yet" />
        ) : (
          items.map((b) => (
            <View key={b.id} style={styles.row}>
              {b.image_url ? (
                <Image source={{ uri: b.image_url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: "#334155" }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{b.title}</Text>
                <Text style={styles.sub}>{b.is_active ? "Showing on Home" : "Hidden"}</Text>
              </View>
              <Pressable onPress={() => toggle(b)} style={styles.btn}>
                <Text style={styles.btnText}>{b.is_active ? "Hide" : "Show"}</Text>
              </Pressable>
              <Pressable onPress={() => remove(b.id)} style={styles.btn}>
                <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  label: { fontFamily: typography.bodySemibold, marginBottom: 6, marginTop: spacing.md, color: colors.adminText },
  input: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.adminCard,
    color: colors.adminText,
  },
  pickBtn: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: colors.adminCard,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  pickText: { color: colors.primary, fontFamily: typography.bodySemibold },
  preview: { width: "100%", height: "100%" },
  clear: { color: colors.danger, fontFamily: typography.bodySemibold, marginBottom: 8 },
  msg: { color: colors.primary, marginVertical: 8 },
  heading: { marginTop: 22, marginBottom: 8, fontFamily: typography.displaySemibold, color: colors.adminText, fontSize: typography.h3 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    backgroundColor: colors.adminCard,
  },
  thumb: { width: 56, height: 36, borderRadius: 6 },
  name: { fontFamily: typography.bodySemibold, color: colors.adminText },
  sub: { fontSize: typography.tiny, color: colors.adminMuted },
  btn: { paddingHorizontal: 8, paddingVertical: 6 },
  btnText: { fontFamily: typography.bodySemibold, color: colors.primary },
});
