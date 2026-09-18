import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";

const SECTIONS: { title: string; links: { label: string; route: string }[] }[] = [
  {
    title: "Orders & money",
    links: [
      { label: "Orders", route: "/admin/orders" },
      { label: "Revenue", route: "/admin/revenue" },
      { label: "Delivery fee", route: "/admin/shop-control" },
    ],
  },
  {
    title: "Catalog",
    links: [
      { label: "Products", route: "/admin/products" },
      { label: "Categories", route: "/admin/categories" },
      { label: "Banners", route: "/admin/banners" },
      { label: "Promotions", route: "/admin/promotions" },
    ],
  },
  {
    title: "Shops",
    links: [
      { label: "Shops", route: "/admin/shops" },
      { label: "Create shop", route: "/admin/create-shop" },
      { label: "Shop products", route: "/admin/shop-products" },
    ],
  },
  {
    title: "Settings",
    links: [
      { label: "Invite admin", route: "/admin/invite-admin" },
      { label: "Footer / email", route: "/admin/footer" },
    ],
  },
];

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ shops: 0, orders: 0, revenue: 0, products: 0 });

  const load = useCallback(async () => {
    try {
      const [{ count: shops }, { count: products }, { data: orders }] = await Promise.all([
        supabase.from("shops").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total"),
      ]);
      const revenue = (orders ?? []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      setStats({
        shops: shops ?? 0,
        products: products ?? 0,
        orders: orders?.length ?? 0,
        revenue,
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminShell title="Supa Admin" showBack={false}>
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
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.statGrid}>
            <Stat label="SHOPS" value={String(stats.shops)} />
            <Stat label="PRODUCTS" value={String(stats.products)} />
            <Stat label="ORDERS" value={String(stats.orders)} />
            <Stat label="REVENUE" value={kwacha(stats.revenue)} />
          </View>
        )}

        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginBottom: spacing.md }}>
            <Text style={styles.section}>{section.title}</Text>
            <View style={styles.linkGrid}>
              {section.links.map((item) => (
                <Pressable
                  key={item.route + item.label}
                  style={[styles.linkCard, shadow.card]}
                  onPress={() => router.push(item.route as any)}
                >
                  <Text style={styles.linkText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.statCard, shadow.card]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textFaint,
    fontFamily: typography.bodySemibold,
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontFamily: typography.displayFont, color: colors.text },
  section: {
    fontSize: typography.small,
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
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
  },
  linkText: {
    fontFamily: typography.bodySemibold,
    color: colors.text,
    fontSize: typography.small,
  },
});
