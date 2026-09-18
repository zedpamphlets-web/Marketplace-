import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { colors, typography } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { EmptyState } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/lib/cart";

export default function DealsScreen() {
  const [items, setItems] = useState<ProductCardData[]>([]);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from("products")
        .select("id, shop_id, name, price, image_url, shops(name)")
        .eq("is_deal", true)
        .then(({ data }) => {
          setItems(
            (data ?? []).map((p: any) => ({
              id: p.id,
              shop_id: p.shop_id,
              name: p.name,
              price: Number(p.price),
              image_url: p.image_url,
              shop_name: p.shops?.name ?? null,
              is_deal: true,
            }))
          );
        });
    }, [])
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Deals Hub</Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {items.length === 0 ? (
          <EmptyState title="No deals yet" subtitle="Deals appear when an admin marks a product as a deal." />
        ) : (
          <View style={styles.grid}>
            {items.map((p) => (
              <View key={p.id} style={styles.gridItem}>
                <ProductCard
                  product={p}
                  variant="home"
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
  title: { fontFamily: typography.displaySemibold, fontSize: 18 },
  body: { padding: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%" },
});
