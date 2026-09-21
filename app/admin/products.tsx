import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  RefreshControl,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import { colors, spacing, radius, typography } from "@/lib/theme";
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
  description?: string | null;
  is_recommended?: boolean;
  is_you_might_like?: boolean;
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
  const [description, setDescription] = useState("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [isRecommended, setIsRecommended] = useState(false);
  const [isYouMightLike, setIsYouMightLike] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [badges, setBadges] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [{ data: productRows }, { data: shopRows }] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, price, stock, shop_id, category, is_deal, badges, image_url, description, is_recommended, is_you_might_like, shops(name)"
        )
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
    if (picked.uri) setLocalImages((prev) => [...prev, picked.uri!]);
  };

  const removeLocalPhoto = (index: number) => {
    setLocalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addProduct = async () => {
    setMessage("");
    if (!name.trim() || !price.trim()) {
      setMessage("Name and price are required.");
      return;
    }
    if (!shopId) {
      setMessage("Select a shop.");
      return;
    }
    setSaving(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < localImages.length; i++) {
        const up = await uploadImageFromUri(
          localImages[i],
          "products",
          `product-${Date.now()}-${i}.jpg`
        );
        if (up.error) {
          setSaving(false);
          setMessage(up.error);
          return;
        }
        if (up.url) uploadedUrls.push(up.url);
      }

      const image_url = uploadedUrls[0] ?? null;
      const images = uploadedUrls.length ? uploadedUrls : null;

      const { error } = await supabase.from("products").insert({
        name: name.trim(),
        price: Number(price),
        stock: Number(stock || 0),
        shop_id: shopId,
        category: category.trim() || null,
        badges,
        image_url,
        images,
        description: description.trim() || null,
        is_recommended: isRecommended,
        is_you_might_like: isYouMightLike,
      });
      setSaving(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");
      setBadges([]);
      setLocalImages([]);
      setIsRecommended(false);
      setIsYouMightLike(false);
      setMessage("Product saved.");
      load();
    } catch (e: any) {
      setSaving(false);
      setMessage(e?.message || "Save failed");
    }
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
        <TextInput
          style={styles.input}
          placeholder="Product name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.textFaint}
        />
        <TextInput
          style={styles.input}
          placeholder="Price (K)"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textFaint}
        />
        <TextInput
          style={styles.input}
          placeholder="Stock"
          value={stock}
          onChangeText={setStock}
          keyboardType="number-pad"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Product description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.label}>Photos</Text>
        <View style={styles.photoRow}>
          {localImages.map((uri, i) => (
            <View key={uri + i} style={styles.photoThumbWrap}>
              <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
              <Pressable style={styles.photoRemove} onPress={() => removeLocalPhoto(i)}>
                <Text style={styles.photoRemoveText}>✕</Text>
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addPhotoBtn} onPress={pickPhoto}>
            <Text style={styles.addPhotoText}>
              {localImages.length === 0 ? "Add photo" : "Add another photo"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Shop</Text>
        <View style={styles.chipRow}>
          {shops.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setShopId(s.id)}
              style={[styles.chip, shopId === s.id && styles.chipOn]}
            >
              <Text style={[styles.chipText, shopId === s.id && styles.chipTextOn]}>{s.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <CategorySelect value={category} onChange={setCategory} />

        <Text style={styles.label}>Badges</Text>
        <BadgePicker value={badges} onChange={setBadges} />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Recommended</Text>
          <Switch
            value={isRecommended}
            onValueChange={setIsRecommended}
            trackColor={{ false: colors.border, true: colors.primaryMuted }}
            thumbColor={isRecommended ? colors.primary : "#f4f3f4"}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>You might like</Text>
          <Switch
            value={isYouMightLike}
            onValueChange={setIsYouMightLike}
            trackColor={{ false: colors.border, true: colors.primaryMuted }}
            thumbColor={isYouMightLike ? colors.primary : "#f4f3f4"}
          />
        </View>

        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Save product" onPress={addProduct} loading={saving} />

        <Text style={[styles.heading, { marginTop: 28 }]}>All products</Text>
        {items.length === 0 ? (
          <EmptyState title="No products yet" />
        ) : (
          items.map((p) => (
            <View key={p.id} style={styles.row}>
              {p.image_url ? (
                <Image source={{ uri: p.image_url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.border }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.sub}>
                  {kwacha(p.price)}
                  {p.shops?.name ? ` · ${p.shops.name}` : ""}
                  {p.is_recommended ? " · Rec" : ""}
                  {p.is_you_might_like ? " · Like" : ""}
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
  label: {
    fontSize: typography.small,
    fontFamily: typography.bodySemibold,
    marginBottom: 6,
    marginTop: 8,
    color: colors.adminText,
  },
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
  textArea: { minHeight: 90, paddingTop: 12 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: spacing.md },
  photoThumbWrap: { position: "relative" },
  photoThumb: { width: 72, height: 72, borderRadius: 8 },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  addPhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    padding: 4,
  },
  addPhotoText: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontFamily: typography.bodySemibold,
    textAlign: "center",
  },
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    fontFamily: typography.bodySemibold,
    color: colors.adminText,
    fontSize: typography.body,
  },
  msg: { color: colors.primary, marginVertical: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 44, height: 44, borderRadius: 8 },
  name: { fontFamily: typography.bodyBold, color: colors.text },
  sub: { color: colors.textMuted, fontSize: typography.tiny, marginTop: 2 },
  delete: { color: colors.danger, fontFamily: typography.bodySemibold },
});
