import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton, EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";
import { CategorySelect } from "@/components/CategorySelect";
import { BadgePicker } from "@/components/ProductBadges";
import { pickImageFromPhone, uploadImageFromUri } from "@/lib/uploadImage";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  shop_id: string;
  category: string | null;
  is_deal: boolean;
  image_url?: string | null;
  shops?: { name: string } | null;
};

type Shop = { id: string; name: string };

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [category, setCategory] = useState("");
  const [shopId, setShopId] = useState("");
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [badges, setBadges] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [{ data: productRows }, { data: shopRows }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price, stock, shop_id, category, is_deal, badges, image_url, shops(name)")
        .order("created_at", { ascending: false }),
      supabase.from("shops").select("id, name").order("name"),
    ]);
    setItems((productRows as any) ?? []);
    setShops((shopRows as Shop[]) ?? []);
    if (!shopId && shopRows && shopRows.length) setShopId(shopRows[0].id);
    setRefreshing(false);
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

  const addProduct = async () => {
    setMessage("");
    if (!name.trim() || !price || !shopId) {
      setMessage("Name, price and shop are required.");
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
      name: name.trim(),
      price: Number(price),
      stock: Number(stock || 0),
      shop_id: shopId,
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
    setMessage("Product saved.");
    load();
  };

  const remove = (id: string) => {
    Alert.alert("Delete product?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("products").delete().eq("id", id);
          if (error) setMessage(error.message);
          load();
        },
      },
    ]);
  };

  return (
    <AdminShell title="Products">
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
        <Text style={styles.heading}>Add product</Text>
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

        <Text style={styles.label}>Shop</Text>
        <View style={styles.chipRow}>
          {shops.map((s) => (
            <Pressable key={s.id} onPress={() => setShopId(s.id)} style={[styles.chip, shopId === s.id && styles.chipOn]}>
              <Text style={[styles.chipText, shopId === s.id && styles.chipTextOn]}>{s.name || "Untitled shop"}</Text>
            </Pressable>
          ))}
        </View>
        {shops.length === 0 ? <Text style={styles.hint}>Create a shop first.</Text> : null}

        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Save product" onPress={addProduct} loading={saving} disabled={!shopId} />

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>All products</Text>
        {items.length === 0 ? (
          <EmptyState title="No products yet" subtitle="Add the first product above." />
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
                  {kwacha(p.price)} · stock {p.stock} · {p.shops?.name ?? "Shop"}
                  {(p as any).badges?.length ? ` · ${(p as any).badges.join(", ")}` : ""}
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
  content: { padding: spacing.lg, paddingBottom: 60 },
  heading: {
    fontFamily: typography.displaySemibold,
    fontSize: typography.h3,
    color: colors.adminText,
    marginBottom: spacing.sm,
  },
  label: { fontSize: typography.small, fontFamily: typography.bodySemibold, marginBottom: 6, marginTop: 8, color: colors.adminText },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.small, color: colors.textMuted },
  chipTextOn: { color: "#fff" },
  hint: { color: colors.textMuted, marginBottom: spacing.sm },
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
  sub: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 2 },
  delete: { color: colors.danger, fontFamily: typography.bodySemibold },
});
