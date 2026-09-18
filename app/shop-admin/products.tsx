import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton, EmptyState } from "@/components/Shared";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";
import { CategorySelect } from "@/components/CategorySelect";
import { BadgePicker } from "@/components/ProductBadges";
import { pickImageFromPhone, uploadImageFromUri } from "@/lib/uploadImage";

export default function ShopProducts() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : "";
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [category, setCategory] = useState("");
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [badges, setBadges] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!shopId) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const pickPhoto = async () => {
    const picked = await pickImageFromPhone("product");
    if (picked.error) {
      setMessage(picked.error);
      return;
    }
    if (picked.uri) setLocalImage(picked.uri);
  };

  const add = async () => {
    if (!shopId || !name.trim() || !price) {
      setMessage("Name and price are required.");
      return;
    }
    setSaving(true);
    let image_url: string | null = null;
    if (localImage) {
      const up = await uploadImageFromUri(localImage, "products", `product-${Date.now()}.jpg`);
      if (up.error) {
        setSaving(false);
        setMessage(up.error);
        return;
      }
      image_url = up.url;
    }
    const { error } = await supabase.from("products").insert({
      shop_id: shopId,
      name: name.trim(),
      price: Number(price),
      stock: Number(stock || 0),
      category: category.trim() || null,
      badges,
      image_url,
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setName("");
    setPrice("");
    setCategory("");
    setBadges([]);
    setLocalImage(null);
    setMessage("Product added.");
    load();
  };

  const remove = (id: string) => {
    Alert.alert("Delete product?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("products").delete().eq("id", id);
          load();
        },
      },
    ]);
  };

  return (
    <AdminShell title="Products">
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput style={styles.input} placeholder="Product name" value={name} onChangeText={setName} placeholderTextColor={colors.textFaint} />
        <TextInput style={styles.input} placeholder="Price (K)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholderTextColor={colors.textFaint} />
        <TextInput style={styles.input} placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholderTextColor={colors.textFaint} />

        <Text style={styles.label}>Product photo (from phone)</Text>
        <Pressable style={styles.pickBtn} onPress={pickPhoto}>
          {localImage ? (
            <Image source={{ uri: localImage }} style={styles.preview} contentFit="cover" />
          ) : (
            <Text style={styles.pickText}>Choose image from gallery</Text>
          )}
        </Pressable>
        {localImage ? (
          <Pressable onPress={() => setLocalImage(null)}>
            <Text style={styles.clear}>Remove photo</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Category</Text>
        <CategorySelect value={category} onChange={setCategory} />
        <Text style={styles.label}>Badges</Text>
        <BadgePicker value={badges} onChange={setBadges} dark />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Add product" onPress={add} loading={saving} />

        {items.length === 0 ? (
          <EmptyState title="No products yet" />
        ) : (
          items.map((p) => (
            <View key={p.id} style={[styles.row, shadow.card]}>
              {p.image_url ? (
                <Image source={{ uri: p.image_url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.border }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.sub}>
                  {kwacha(p.price)} · stock {p.stock}
                </Text>
              </View>
              <Pressable onPress={() => remove(p.id)}>
                <Text style={styles.delete}>Delete</Text>
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
  label: { fontFamily: typography.bodySemibold, marginBottom: 4, marginTop: 8, color: colors.adminText },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  pickBtn: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  pickText: { color: colors.primary, fontFamily: typography.bodySemibold },
  preview: { width: "100%", height: "100%" },
  clear: { color: colors.danger, fontFamily: typography.bodySemibold, marginBottom: 8 },
  msg: { color: colors.primary, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  thumb: { width: 44, height: 44, borderRadius: 8 },
  name: { fontFamily: typography.bodyBold, color: colors.text },
  sub: { color: colors.textMuted, fontSize: typography.tiny },
  delete: { color: colors.danger, fontFamily: typography.bodySemibold },
});
