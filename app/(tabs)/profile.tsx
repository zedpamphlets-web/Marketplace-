import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { SectionHeader } from "@/components/Shared";
import { supabase } from "@/lib/supabase";
import { useUserRole } from "@/lib/useUserRole";
import { addToCart } from "@/lib/cart";

export default function ProfileScreen() {
  const role = useUserRole();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [name, setName] = useState("Guest");
  const [orderStats, setOrderStats] = useState({ unpaid: 0, paid: 0, delivered: 0 });
  const guest = role.type === "guest" || role.type === "loading";

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [{ data: userData }, productsRes] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("products")
            .select("id, shop_id, name, price, image_url, rating, is_deal, category")
            .order("created_at", { ascending: false })
            .limit(20),
        ]);
        const user = userData.user;
        const meta = user?.user_metadata || {};
        setName(meta.full_name || meta.name || user?.email?.split("@")[0] || "Guest");

        const rows = productsRes.data ?? [];
        const shopIds = [...new Set(rows.map((p: any) => p.shop_id).filter(Boolean))];
        let shopNames: Record<string, string> = {};
        if (shopIds.length) {
          const { data: shops } = await supabase.from("shops").select("id, name").in("id", shopIds);
          (shops ?? []).forEach((s: any) => {
            shopNames[s.id] = s.name;
          });
        }
        setProducts(
          rows.map((p: any) => ({
            id: p.id,
            shop_id: p.shop_id,
            name: p.name,
            price: Number(p.price),
            image_url: p.image_url,
            rating: p.rating,
            is_deal: p.is_deal,
            category: p.category,
            shop_name: shopNames[p.shop_id] ?? null,
          }))
        );

        if (user) {
          const { data: myOrders } = await supabase
            .from("orders")
            .select("status, payment_status")
            .eq("customer_id", user.id);
          let unpaid = 0, paid = 0, delivered = 0;
          (myOrders ?? []).forEach((o: any) => {
            const pay = (o.payment_status || "pending").toLowerCase();
            if (pay === "paid") paid += 1;
            else unpaid += 1;
            if (o.status === "delivered") delivered += 1;
          });
          setOrderStats({ unpaid, paid, delivered });
        } else {
          setOrderStats({ unpaid: 0, paid: 0, delivered: 0 });
        }
      })();
    }, [])
  );

  const initial = (name[0] || "G").toUpperCase();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {guest ? (
            <Pressable style={styles.user} onPress={() => router.push("/auth/login")}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>G</Text>
              </View>
              <View>
                <Text style={styles.name}>Sign in</Text>
                <Text style={styles.subName}>Access orders & more</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.user}>
              <View style={[styles.avatar, styles.avatarActive]}>
                <Text style={[styles.avatarText, { color: "#fff" }]}>{initial}</Text>
              </View>
              <View>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.subName}>Your account</Text>
              </View>
            </View>
          )}
          <Pressable onPress={() => router.push("/settings")} hitSlop={10} style={styles.gear}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={1.8}>
              <Circle cx="12" cy="12" r="3" />
              <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.1z" />
            </Svg>
          </Pressable>
        </View>

        {!guest ? (
          <View style={styles.statsRow}>
            <Pressable style={styles.statBox} onPress={() => router.push("/(tabs)/orders")}>
              <Text style={styles.statNum}>{orderStats.unpaid}</Text>
              <Text style={styles.statLbl}>Unpaid</Text>
            </Pressable>
            <Pressable style={styles.statBox} onPress={() => router.push("/(tabs)/orders")}>
              <Text style={styles.statNum}>{orderStats.paid}</Text>
              <Text style={styles.statLbl}>Paid</Text>
            </Pressable>
            <Pressable style={styles.statBox} onPress={() => router.push("/(tabs)/orders")}>
              <Text style={styles.statNum}>{orderStats.delivered}</Text>
              <Text style={styles.statLbl}>Delivered</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Menu rows */}
        <View style={styles.menuCard}>
          <Pressable style={styles.row} onPress={() => router.push("/(tabs)/orders")}>
            <Text style={styles.rowTitle}>Your orders</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={() => router.push("/deals")}>
            <Text style={styles.rowTitle}>Deals Hub</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <View style={styles.split}>
            <Pressable style={styles.splitItem} onPress={() => router.push("/history")}>
              <Text style={styles.splitText}>History</Text>
            </Pressable>
            <View style={styles.splitDivider} />
            <Pressable style={styles.splitItem} onPress={() => router.push("/addresses")}>
              <Text style={styles.splitText}>Addresses</Text>
            </Pressable>
          </View>
        </View>

        {/* Trust bar */}
        <View style={styles.trust}>
          <Text style={styles.trustText}>Free shipping</Text>
          <Text style={styles.trustDot}>·</Text>
          <Text style={styles.trustText}>Return if item damaged</Text>
        </View>

        {role.type === "super_admin" && (
          <Pressable style={styles.adminLink} onPress={() => router.push("/admin")}>
            <Text style={styles.adminText}>Open admin</Text>
          </Pressable>
        )}
        {role.type === "shop_admin" && (
          <Pressable style={styles.adminLink} onPress={() => router.push("/shop-admin")}>
            <Text style={styles.adminText}>Open shop dashboard</Text>
          </Pressable>
        )}

        {/* Recommended */}
        {products.length > 0 && (
          <View style={styles.productBlock}>
            <SectionHeader title="You might like" />
            <View style={styles.grid}>
              {products.map((p) => (
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActive: {
    backgroundColor: colors.primary,
  },
  avatarText: {
    fontFamily: typography.bodyBold,
    color: colors.text,
    fontSize: 16,
  },
  name: {
    fontSize: typography.h3,
    fontFamily: typography.bodySemibold,
    color: colors.text,
  },
  subName: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    fontFamily: typography.bodyMedium,
    marginTop: 2,
  },
  gear: {
    padding: 6,
  },
  menuCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
  },
  rowTitle: {
    fontSize: typography.body,
    color: colors.text,
    fontFamily: typography.bodyMedium,
  },
  chev: {
    color: colors.textFaint,
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  split: {
    flexDirection: "row",
  },
  splitItem: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  splitDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  splitText: {
    color: colors.text,
    fontFamily: typography.bodyMedium,
    fontSize: typography.small,
  },
  trust: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.successMuted,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  trustText: {
    color: colors.success,
    fontSize: typography.tiny,
    fontFamily: typography.bodyMedium,
  },
  trustDot: {
    color: colors.success,
  },
  adminLink: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 10,
  },
  adminText: {
    color: colors.primary,
    fontFamily: typography.bodySemibold,
    fontSize: typography.small,
  },
  productBlock: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48.5%",
  },
});
