import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { PrimaryButton } from "@/components/Shared";
import { readCart, writeCart, type CartLine } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { LIPILA_PROVIDERS, toZambianMsisdn, type LipilaProvider } from "@/lib/lipila";

export default function CheckoutScreen() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [provider, setProvider] = useState<LipilaProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(50);

  useFocusEffect(
    useCallback(() => {
      readCart().then(setLines);
      (async () => {
        const { data } = await supabase.from("settings").select("delivery_fee_local").eq("id", "global").maybeSingle();
        if (data?.delivery_fee_local != null) setDeliveryFee(Number(data.delivery_fee_local));
      })();
    }, [])
  );

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const total = subtotal + deliveryFee;

  const handlePay = async () => {
    setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push("/auth/login");
      return;
    }
    if (!lines.length) {
      setMessage("Your cart is empty.");
      return;
    }
    if (!fullName.trim()) {
      setMessage("Enter your name.");
      return;
    }
    if (!phone.trim()) {
      setMessage("Enter your phone number.");
      return;
    }
    if (!location.trim()) {
      setMessage("Enter your location.");
      return;
    }
    if (!provider) {
      setMessage("Choose a payment method: Airtel, MTN, or Zamtel.");
      return;
    }

    setLoading(true);
    try {
      const shopId = lines[0].shop_id;
      if (!shopId) throw new Error("Cart items are missing a shop.");

      const msisdn = toZambianMsisdn(phone);
      // Pricing is computed server-side by create_order() from the current
      // product prices — we only send product ids and quantities, never
      // the price shown on screen, so a tampered local cart can't be used
      // to pay less than the real total.
      const { data: order, error } = await supabase
        .rpc("create_order", {
          p_shop_id: shopId,
          p_items: lines.map((l) => ({ product_id: l.id, qty: l.qty })),
          p_full_name: fullName.trim(),
          p_phone: msisdn,
          p_location: location.trim(),
          p_payment_method: provider,
        })
        .single();
      if (error || !order) throw new Error(error?.message || "Could not create order.");

      await writeCart([]);
      router.replace({
        pathname: "/pay",
        params: {
          orderId: order.order_id,
          provider,
          phone: msisdn,
        },
      });
    } catch (e: any) {
      setMessage(e.message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 1. Name */}
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.step}>1 · Name</Text>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor={colors.textFaint}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        {/* 2. Phone */}
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.step}>2 · Phone number</Text>
          <Text style={styles.label}>Mobile money number</Text>
          <TextInput
            style={styles.input}
            placeholder="0960 000 000"
            placeholderTextColor={colors.textFaint}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* 3. Location */}
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.step}>3 · Location</Text>
          <Text style={styles.label}>Delivery location</Text>
          <TextInput
            style={[styles.input, styles.inputTall]}
            placeholder="Area, street, landmark"
            placeholderTextColor={colors.textFaint}
            value={location}
            onChangeText={setLocation}
            multiline
          />
        </View>

        {/* 4. Payment method */}
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.step}>4 · Payment method</Text>
          <Text style={styles.label}>Choose one</Text>
          <View style={styles.payCol}>
            {LIPILA_PROVIDERS.map((p) => {
              const on = provider === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setProvider(p.id)}
                  style={[styles.payCard, on && styles.payCardOn]}
                >
                  <View style={[styles.radio, on && styles.radioOn]}>
                    {on ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.payText, on && styles.payTextOn]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Subtotal</Text>
            <Text style={styles.rowValue}>K {subtotal.toFixed(0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Delivery</Text>
            <Text style={styles.rowValue}>K {deliveryFee.toFixed(0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>K {total.toFixed(0)}</Text>
          </View>
          {message ? <Text style={styles.msg}>{message}</Text> : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={
            provider
              ? `Pay K ${total.toFixed(0)} · ${provider === "mtn" ? "MTN" : provider === "airtel" ? "Airtel" : "Zamtel"}`
              : `Pay K ${total.toFixed(0)}`
          }
          onPress={handlePay}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { fontSize: 28, color: colors.text, lineHeight: 30 },
  title: {
    fontSize: typography.h3,
    fontFamily: typography.displaySemibold,
    color: colors.text,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: {
    fontSize: typography.small,
    fontFamily: typography.bodyBold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.small,
    fontFamily: typography.bodySemibold,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: "#fff",
  },
  inputTall: { minHeight: 72, textAlignVertical: "top" },
  payCol: { gap: 10 },
  payCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  payCardOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  payText: {
    fontFamily: typography.bodySemibold,
    color: colors.text,
    fontSize: typography.body,
  },
  payTextOn: { color: colors.primary },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rowLabel: { color: colors.textMuted },
  rowValue: { fontFamily: typography.bodySemibold, color: colors.text },
  totalLabel: { fontFamily: typography.bodyBold, fontSize: 16, color: colors.text },
  totalValue: { fontFamily: typography.bodyBold, fontSize: 16, color: colors.primary },
  msg: { color: colors.danger, marginTop: 8, fontSize: typography.small },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
