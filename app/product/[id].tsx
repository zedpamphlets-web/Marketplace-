import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { ProductBadgeRow } from "@/components/ProductBadges";
import { PrimaryButton } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [shopName, setShopName] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, shop_id, name, price, image_url, rating, category, badges, sold_count")
        .eq("id", id)
        .maybeSingle();
      setProduct(data);
      if (data?.shop_id) {
        const { data: shop } = await supabase.from("shops").select("name").eq("id", data.shop_id).maybeSingle();
        setShopName(shop?.name ?? "");
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.screen}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={{ padding: 16 }}>Product not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        {shopName ? <Text style={styles.shopTag}>{shopName}</Text> : null}
        <View style={{ marginBottom: 8 }}>
          <ProductBadgeRow ids={product.badges} compact={false} />
        </View>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>
          K {Number(product.price).toLocaleString("en-ZM", { maximumFractionDigits: 0 })}
        </Text>
        {product.category ? <Text style={styles.rating}>{product.category}</Text> : null}

        <View style={styles.stepperRow}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyText}>{qty}</Text>
            <Pressable style={styles.stepBtn} onPress={() => setQty((q) => q + 1)}>
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label={`Add to Cart · K ${(Number(product.price) * qty).toLocaleString("en-ZM")}`}
          onPress={async () => {
            for (let i = 0; i < qty; i += 1) {
              await addToCart({
                id: product.id,
                name: product.name,
                shopName,
                price: Number(product.price),
                image_url: product.image_url,
                shop_id: product.shop_id,
              });
            }
            router.push("/(tabs)/cart");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  topBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 20, color: colors.text },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  image: { width: "100%", height: 240, borderRadius: 12, backgroundColor: "#F3F4F6" },
  imagePlaceholder: { width: "100%", height: 240, borderRadius: 12, backgroundColor: "#F3F4F6" },
  shopTag: { marginTop: 12, color: colors.textMuted, fontSize: 13 },
  name: { fontSize: 22, fontFamily: typography.displaySemibold, color: colors.text, marginTop: 6 },
  price: { fontSize: 20, fontFamily: typography.bodyBold, marginTop: 8, color: colors.text },
  rating: { color: colors.textMuted, marginTop: 6 },
  stepperRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  qtyLabel: { fontFamily: typography.bodySemibold },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  stepBtnText: { fontSize: 18 },
  qtyText: { minWidth: 20, textAlign: "center", fontFamily: typography.bodyBold },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
});
