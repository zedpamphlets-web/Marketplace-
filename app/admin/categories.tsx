import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton, EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { CATEGORY_ICON_PRESETS, emojiForCategory } from "@/lib/categoryIcons";
import { pickImageFromPhone, uploadImageFromUri } from "@/lib/uploadImage";

type Category = {
  id: string;
  name: string;
  sort_order: number | null;
  icon?: string | null;
  icon_url?: string | null;
};

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("fashion");
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("fashion");
  const [editLocalImage, setEditLocalImage] = useState<string | null>(null);
  const [editExistingUrl, setEditExistingUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, sort_order, icon, icon_url")
      .order("sort_order", { ascending: true });
    if (error) setMessage(error.message);
    setItems((data as Category[]) ?? []);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const pickFromPhone = async (forEdit: boolean) => {
    const picked = await pickImageFromPhone("icon");
    if (picked.error) {
      setMessage(picked.error);
      return;
    }
    if (!picked.uri) return;
    if (forEdit) {
      setEditLocalImage(picked.uri);
      setEditExistingUrl(null);
    } else {
      setLocalImage(picked.uri);
    }
  };

  const add = async () => {
    setMessage("");
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Enter a category name.");
      return;
    }
    setSaving(true);
    let icon_url: string | null = null;
    if (localImage) {
      const up = await uploadImageFromUri(localImage, "categories", `cat-${Date.now()}.jpg`);
      if (up.error) {
        setSaving(false);
        setMessage(up.error);
        return;
      }
      icon_url = up.url;
    }
    const nextOrder = (items[items.length - 1]?.sort_order ?? items.length) + 1;
    const { error } = await supabase.from("categories").insert({
      name: trimmed,
      sort_order: nextOrder,
      icon: localImage ? null : icon,
      icon_url,
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setName("");
    setLocalImage(null);
    setIcon("fashion");
    setMessage("Category added.");
    load();
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditIcon(c.icon || "fashion");
    setEditLocalImage(null);
    setEditExistingUrl(c.icon_url || null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setMessage("Name cannot be empty.");
      return;
    }
    setSaving(true);
    let icon_url = editExistingUrl;
    if (editLocalImage) {
      const up = await uploadImageFromUri(editLocalImage, "categories", `cat-${editingId}-${Date.now()}.jpg`);
      if (up.error) {
        setSaving(false);
        setMessage(up.error);
        return;
      }
      icon_url = up.url;
    }
    const { error } = await supabase
      .from("categories")
      .update({
        name: trimmed,
        icon: icon_url ? null : editIcon,
        icon_url,
      })
      .eq("id", editingId);
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setEditingId(null);
    setMessage("Category updated.");
    load();
  };

  const remove = (c: Category) => {
    Alert.alert("Delete category?", c.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("categories").delete().eq("id", c.id);
          if (error) setMessage(error.message);
          load();
        },
      },
    ]);
  };

  const IconPicker = ({ value, onChange }: { value: string; onChange: (k: string) => void }) => (
    <View style={styles.iconGrid}>
      {CATEGORY_ICON_PRESETS.map((p) => {
        const on = value === p.key;
        return (
          <Pressable key={p.key} onPress={() => onChange(p.key)} style={[styles.iconCell, on && styles.iconCellOn]}>
            <Text style={styles.iconEmoji}>{p.emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <AdminShell title="Categories">
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
        <Text style={styles.label}>Category name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Electronics"
          placeholderTextColor={colors.adminMuted}
        />

        <Text style={styles.label}>Pick photo from phone</Text>
        <Pressable style={styles.pickBtn} onPress={() => pickFromPhone(false)}>
          {localImage ? (
            <Image source={{ uri: localImage }} style={styles.preview} contentFit="cover" />
          ) : (
            <Text style={styles.pickText}>Choose image from gallery</Text>
          )}
        </Pressable>
        {localImage ? (
          <Pressable onPress={() => setLocalImage(null)} style={{ marginBottom: 8 }}>
            <Text style={styles.clear}>Remove photo</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Or choose a quick icon</Text>
        <IconPicker
          value={icon}
          onChange={(k) => {
            setIcon(k);
            setLocalImage(null);
          }}
        />

        {message ? <Text style={styles.msg}>{message}</Text> : null}
        {saving && !editingId ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} /> : null}
        <PrimaryButton label="Add category" onPress={add} loading={saving && !editingId} />

        <Text style={styles.heading}>All categories</Text>
        {items.length === 0 ? (
          <EmptyState title="No categories" subtitle="Add categories used on Home and products." />
        ) : (
          items.map((c) => (
            <View key={c.id} style={styles.row}>
              {editingId === c.id ? (
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    placeholderTextColor={colors.adminMuted}
                  />
                  <Text style={styles.label}>Pick photo from phone</Text>
                  <Pressable style={styles.pickBtn} onPress={() => pickFromPhone(true)}>
                    {editLocalImage || editExistingUrl ? (
                      <Image
                        source={{ uri: editLocalImage || editExistingUrl || undefined }}
                        style={styles.preview}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.pickText}>Choose image from gallery</Text>
                    )}
                  </Pressable>
                  <Text style={styles.label}>Or quick icon</Text>
                  <IconPicker
                    value={editIcon}
                    onChange={(k) => {
                      setEditIcon(k);
                      setEditLocalImage(null);
                      setEditExistingUrl(null);
                    }}
                  />
                  <View style={styles.actions}>
                    <Pressable onPress={saveEdit}>
                      <Text style={styles.save}>Save</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditingId(null)}>
                      <Text style={styles.cancel}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.iconPreview}>
                    {c.icon_url ? (
                      <Image source={{ uri: c.icon_url }} style={styles.iconImg} contentFit="cover" />
                    ) : (
                      <Text style={styles.iconEmoji}>{emojiForCategory(c.icon, c.icon_url)}</Text>
                    )}
                  </View>
                  <Text style={styles.name}>{c.name}</Text>
                  <Pressable onPress={() => startEdit(c)} style={styles.btn}>
                    <Text style={styles.btnText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(c)} style={styles.btn}>
                    <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
                  </Pressable>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  label: {
    fontFamily: typography.bodySemibold,
    marginBottom: 6,
    marginTop: 8,
    color: colors.adminText,
  },
  heading: {
    marginTop: 22,
    marginBottom: 8,
    fontFamily: typography.displaySemibold,
    color: colors.adminText,
    fontSize: typography.h3,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.adminCard,
    color: colors.adminText,
    marginBottom: spacing.sm,
  },
  pickBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.adminCard,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  pickText: { color: colors.primary, fontFamily: typography.bodySemibold },
  preview: { width: "100%", height: "100%" },
  clear: { color: colors.danger, fontFamily: typography.bodySemibold },
  msg: { color: colors.primary, marginBottom: spacing.sm },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.adminCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCellOn: { borderColor: colors.primary, backgroundColor: "#1E3A5F" },
  iconEmoji: { fontSize: 22 },
  iconPreview: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.adminCard,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconImg: { width: 40, height: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
    backgroundColor: colors.adminCard,
  },
  name: { flex: 1, fontFamily: typography.bodySemibold, color: colors.adminText },
  btn: { paddingHorizontal: 8, paddingVertical: 6 },
  btnText: { fontFamily: typography.bodySemibold, color: colors.primary },
  actions: { flexDirection: "row", gap: 16, marginTop: 8 },
  save: { color: colors.primary, fontFamily: typography.bodyBold },
  cancel: { color: colors.adminMuted, fontFamily: typography.bodySemibold },
});
