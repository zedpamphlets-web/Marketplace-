import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { StatusPill, PaymentPill } from "@/components/StatusPill";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";

const LINKS = [
  { label: "Orders", route: "/shop-admin/orders" },
  { label: "Products", route: "/shop-admin/products" },
  { label: "Riders", route: "/shop-admin/riders" },
  { label: "Edit Shop", route: "/shop-admin/edit" },
  { label: "Shop Prices", route: "/shop-admin/prices" },
  { label: "Total Revenue", route: "/shop-admin/revenue" },
  { label: "Delivery fee", route: "/shop-admin/control" },
  { label: "Categories", route: "/shop-admin/categories" },
];

type ShopInfo = {
  logo_url: string | null;
  banner_1: string | null;
  delivery_fee?: number | null;
  name?: string | null;
};

export default function ShopAdminDashboard() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : null;
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0 });
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!shopId) return;
    const [{ data: orderRows }, { count: productCount }, { data: shopRow }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total, status, payment_status, created_at")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("shop_id", shopId),
      supabase
        .from("shops")
        .select("name, logo_url, banner_1, delivery_fee")
        .eq("id", shopId)
        .maybeSingle(),
    ]);
    const list = orderRows ?? [];
    const paidRevenue = list
      .filter((o) => o.payment_status === "paid")
      .reduce((s, o) => s + Number(o.total || 0), 0);
    setOrders(list);
    setStats({
      orders: list.length,
      revenue: paidRevenue,
      products: productCount ?? 0,
    });
    setShop((shopRow as ShopInfo) ?? null);
    setRefreshing(false);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const missing: string[] = [];
  if (shop) {
    if (!shop.logo_url) missing.push("logo");
    if (!shop.banner_1) missing.push("banner image");
    if (shop.delivery_fee == null) missing.push("delivery fee");
  }

  return (
    <AdminShell title="Shop Dashboard" showBack={false}>
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
        {missing.length > 0 ? (
          <Pressable style={styles.setupBanner} onPress={() => router.push("/shop-admin/edit" as any)}>
            <Text style={styles.setupTitle}>Complete your shop setup</Text>
            <Text style={styles.setupBody}>
              Missing: {missing.join(", ")}. Tap to edit shop details.
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.statGrid}>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statLabel}>ORDERS</Text>
            <Text style={styles.statValue}>{stats.orders}</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statLabel}>REVENUE (PAID)</Text>
            <Text style={styles.statValue}>{kwacha(stats.revenue)}</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statLabel}>PRODUCTS</Text>
            <Text style={styles.statValue}>{stats.products}</Text>
          </View>
        </View>

        <Text style={styles.section}>Manage</Text>
        <View style={styles.linkGrid}>
          {LINKS.map((item) => (
            <Pressable
              key={item.label}
              style={[styles.linkCard, shadow.card]}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.linkText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Recent orders</Text>
        {orders.length === 0 ? (
          <Text style={styles.empty}>No orders yet.</Text>
        ) : (
          orders.map((o) => (
            <View key={o.id} style={[styles.orderRow, shadow.card]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>#{String(o.id).slice(0, 8)}</Text>
                <Text style={styles.orderSub}>{kwacha(o.total)}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <PaymentPill status={o.payment_status} />
                <StatusPill status={o.status} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  setupBanner: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  setupTitle: {
    fontFamily: typography.bodyBold,
    color: "#92400E",
    marginBottom: 4,
  },
  setupBody: {
    color: "#B45309",
    fontSize: typography.small,
  },
  statGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { fontSize: 10, color: colors.textFaint, fontFamily: typography.bodySemibold, marginBottom: 8 },
  statValue: { fontSize: 20, fontFamily: typography.displayFont, color: colors.text },
  section: {
    fontFamily: typography.bodyBold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  linkGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  linkCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: { fontFamily: typography.bodySemibold, color: colors.text },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderId: { fontFamily: typography.bodyBold, color: colors.text },
  orderSub: { color: colors.textMuted, fontSize: typography.tiny },
});
