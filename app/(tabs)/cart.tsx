import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import Svg, { Path, Rect, Circle, Polyline } from "react-native-svg";
import { colors, shadow, typography } from "@/lib/theme";
import { type ProductCardData } from "@/components/ProductCard";
import { SimpleProductCard } from "@/components/SimpleProductCard";
import { mergeProductsCache, readProductsCache } from "@/lib/catalogCache";
import { supabase } from "@/lib/supabase";
import { addToCart, readCart, writeCart, type CartLine } from "@/lib/cart";
import { kwacha } from "@/lib/adminActions";

function Trolley() {
  return (
    <Svg width={72} height={64} viewBox="0 0 72 64">
      <Path d="M14 44h36l6-26H20" stroke="#9CA3AF" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <Rect x="22" y="14" width="22" height="16" rx="3" fill="#F59E0B" />
      <Rect x="26" y="10" width="14" height="8" rx="2" fill="#FBBF24" />
      <Circle cx="24" cy="50" r="5" fill="#6B7280" />
      <Circle cx="44" cy="50" r="5" fill="#6B7280" />
    </Svg>
  );
}

export default function CartScreen() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [recs, setRecs] = useState<ProductCardData[]>([]);
  const [sheet, setSheet] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  const load = useCallback(async () => {
    setCart(await readCart());
    const map = (p: any) => ({
      id: p.id,
      shop_id: p.shop_id,
      name: p.name,
      price: Number(p.price),
      image_url: p.image_url,
      original_price: p.original_price,
    });
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, shop_id, name, price, image_url, original_price, is_recommended")
        .eq("is_recommended", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      setRecs((data ?? []).map(map));
      await mergeProductsCache(data ?? []);
    } catch {
      const cached = await readProductsCache<any>();
      setRecs(cached.filter((p) => p.is_recommended).slice(0, 12).map(map));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const updateQty = async (id: string, delta: number) => {
    const next = cart
      .map((l) => (l.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l))
      .filter((l) => l.qty > 0);
    setCart(next);
    await writeCart(next);
  };

  const count = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = selectAll ? cart.reduce((s, l) => s + l.price * l.qty, 0) : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart ({count})</Text>
        <Text style={styles.toZm}>To ZM</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {cart.length === 0 ? (
          <View style={styles.emptyBox}>
            <Trolley />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Pressable style={styles.sourceBtn} onPress={() => router.push("/(tabs)/categories")}>
              <Text style={styles.sourceText}>Source by category</Text>
            </Pressable>
          </View>
        ) : (
          cart.map((line) => (
            <View key={line.id} style={[styles.line, shadow.card]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{line.name}</Text>
                <Text style={styles.meta}>{line.shopName}</Text>
                <Text style={styles.price}>{kwacha(line.price)}</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable onPress={() => updateQty(line.id, -1)} style={styles.step}>
                  <Text>−</Text>
                </Pressable>
                <Text style={styles.qty}>{line.qty}</Text>
                <Pressable onPress={() => updateQty(line.id, 1)} style={styles.step}>
                  <Text>+</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Pressable style={styles.protectCard} onPress={() => setSheet(true)}>
          <View style={styles.protectHead}>
            <Text style={styles.protectTitle}>Order protection</Text>
            <Text style={styles.chev}>›</Text>
          </View>
          <Text style={styles.protectHint}>Only orders placed and paid in this app are covered.</Text>
          <View style={styles.iconRow}>
            <View style={styles.iconItem}>
              <Text style={styles.iconMark}>✓</Text>
              <Text style={styles.iconLabel}>Secure{"\n"}payments</Text>
            </View>
            <View style={styles.iconItem}>
              <Text style={styles.iconMark}>🚚</Text>
              <Text style={styles.iconLabel}>Guaranteed{"\n"}delivery</Text>
            </View>
            <View style={styles.iconItem}>
              <Text style={styles.iconMark}>↩</Text>
              <Text style={styles.iconLabel}>Money-back{"\n"}guarantee</Text>
            </View>
            <View style={styles.iconItem}>
              <Text style={styles.iconMark}>24h</Text>
              <Text style={styles.iconLabel}>24/7{"\n"}support</Text>
            </View>
          </View>
          <Text style={styles.paySupported}>Payments supported: MTN · Airtel · Zamtel</Text>
        </Pressable>

        {recs.length > 0 && (
          <>
            <Text style={styles.recTitle}>Recommended</Text>
            <View style={styles.simpleGrid}>
              {recs.map((p) => (
                <SimpleProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    shop_id: p.shop_id,
                    name: p.name,
                    price: p.price,
                    image_url: p.image_url,
                    original_price: (p as any).original_price,
                  }}
                  onAddToCart={async (item) => {
                    await addToCart({
                      id: item.id,
                      name: item.name,
                      shopName: "",
                      price: item.price,
                      image_url: item.image_url,
                      shop_id: item.shop_id,
                    });
                    load();
                  }}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bar}>
        <Pressable onPress={() => setSelectAll((v) => !v)} style={styles.all}>
          <View style={[styles.radio, selectAll && styles.radioOn]} />
          <Text>All</Text>
        </Pressable>
        <Text style={styles.barTotal}>K {subtotal.toFixed(0)}</Text>
        <Pressable
          style={[styles.checkout, cart.length === 0 && styles.checkoutOff]}
          onPress={() => cart.length && router.push("/checkout")}
        >
          <Text style={styles.checkoutText}>Check out</Text>
        </Pressable>
      </View>

      <Modal visible={sheet} animationType="slide" transparent onRequestClose={() => setSheet(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheet(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetTop}>
            <Text style={styles.sheetTitle}>Protections</Text>
            <Pressable onPress={() => setSheet(false)}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={styles.blockTitle}>How to keep your order protected</Text>
            <Text style={styles.blockText}>
              When placing an order yourself: your order is protected from the moment you tap Check out and pay with MTN, Airtel or Zamtel.
            </Text>
            <Text style={styles.blockText}>
              Pay only inside this app. Do not send money to a personal number outside checkout.
            </Text>

            <Text style={styles.blockTitle}>Secure payments</Text>
            <Text style={styles.blockText}>
              Choose MTN MoMo, Airtel Money or Zamtel Kwacha. Every payment goes through Lipila and stays in Kwacha.
            </Text>
            <View style={styles.payRow}>
              {["MTN", "Airtel", "Zamtel"].map((p) => (
                <View key={p} style={styles.payChip}>
                  <Text style={styles.payChipText}>{p}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.blockTitle}>Guaranteed delivery</Text>
            <Text style={styles.blockText}>
              Your order is dispatched by the shop. If delivery is delayed, the shop follows up until it arrives.
            </Text>

            <Text style={styles.blockTitle}>Refund policy</Text>
            <Text style={styles.blockText}>
              Claim a refund if the order is not shipped, is missing, or arrives damaged or incorrect.
            </Text>

            <Text style={styles.blockTitle}>Customer support</Text>
            <Text style={styles.blockText}>Use Help & Support in the menu if you need help with an order.</Text>

            <Text style={styles.blockTitle}>Data privacy</Text>
            <Text style={styles.blockText}>
              We do not share your data with third parties without your consent. Personal information is used only to process your order.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "baseline", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 22, fontFamily: typography.displaySemibold, color: colors.text },
  toZm: { color: colors.textMuted, fontSize: 13 },
  content: { paddingHorizontal: 16, paddingBottom: 90 },
  emptyBox: { alignItems: "center", paddingVertical: 28 },
  emptyTitle: { fontFamily: typography.bodySemibold, fontSize: 16, marginTop: 12, marginBottom: 14 },
  sourceBtn: { borderWidth: 1, borderColor: "#111", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10 },
  sourceText: { fontFamily: typography.bodySemibold },
  line: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: "#fff" },
  name: { fontFamily: typography.bodySemibold },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  price: { fontFamily: typography.bodyBold, marginTop: 4 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  step: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  qty: { minWidth: 16, textAlign: "center" },
  protectCard: { marginTop: 8, marginBottom: 18, paddingVertical: 12 },
  protectHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  protectTitle: { fontFamily: typography.displaySemibold, fontSize: 16 },
  chev: { fontSize: 22, color: colors.textFaint },
  protectHint: { color: colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 14 },
  iconRow: { flexDirection: "row", justifyContent: "space-between" },
  iconItem: { width: "24%", alignItems: "center" },
  iconMark: { color: "#16A34A", fontFamily: typography.bodyBold, marginBottom: 6 },
  iconLabel: { textAlign: "center", fontSize: 11, color: colors.text },
  paySupported: { marginTop: 12, color: colors.textMuted, fontSize: 12 },
  recTitle: { fontFamily: typography.displaySemibold, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%" },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  all: { flexDirection: "row", alignItems: "center", gap: 6 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: "#9CA3AF" },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  barTotal: { marginLeft: "auto", fontFamily: typography.bodyBold },
  checkout: { backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  checkoutOff: { opacity: 0.45 },
  checkoutText: { color: "#fff", fontFamily: typography.bodyBold },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { maxHeight: "80%", backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 12 },
  sheetTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sheetTitle: { fontFamily: typography.displaySemibold, fontSize: 18 },
  close: { fontSize: 20, color: colors.textMuted },
  blockTitle: { fontFamily: typography.bodySemibold, marginTop: 16, marginBottom: 6, color: colors.text },
  blockText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  payRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  payChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#F3F4F6", borderRadius: 8 },
  payChipText: { fontFamily: typography.bodySemibold },
});
