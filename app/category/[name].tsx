import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { colors, typography } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";

export default function CategoryProductsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const title = decodeURIComponent(name || "Category");
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const { data } = await supabase
          .from("products")
          .select("id, shop_id, name, price, image_url, rating, is_deal, category")
          .eq("category", title)
          .order("created_at", { ascending: false });
        setItems(
          (data ?? []).map((p: any) => ({
            id: p.id,
            shop_id: p.shop_id,
            name: p.name,
            price: Number(p.price),
            image_url: p.image_url,
            rating: p.rating,
            is_deal: p.is_deal,
            category: p.category,
          }))
        );
        setLoading(false);
      })();
    }, [title])
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <EmptyState title="No products yet" subtitle="Products in this category appear when a shop adds them." />
        ) : (
          <View style={styles.grid}>
            {items.map((p) => (
              <View key={p.id} style={styles.gridItem}>
                <ProductCard
                  product={p}
                  variant="shop"
                  onAddToCart={(item) =>
                    addToCart({
                      id: item.id,
                      name: item.name,
                      shopName: item.shop_name || "",
                      price: item.price,
                      image_url: item.image_url,
                      shop_id: item.shop_id,
                    })
                  }
                />
              </View>
            ))}
          </View>
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
  back: { fontSize: 28, color: colors.text },
  title: { flex: 1, textAlign: "center", fontFamily: typography.displaySemibold, fontSize: 16 },
  body: { padding: 12, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%" },
});
