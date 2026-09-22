import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { StatusPill } from "@/components/StatusPill";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";
import { setOrderStatus } from "@/lib/orderActions";

type OrderItem = {
  quantity: number;
  price_at_purchase: number;
  products?: { name?: string; image_url?: string | null } | null;
};

type Order = {
  id: string;
  total: number;
  status: string;
  payment_status: string | null;
  delivery_address?: any;
  shop_confirmed?: boolean | null;
  created_at?: string;
  order_items?: OrderItem[];
};

function relativeTime(iso?: string, now = Date.now()): string {
  if (!iso) return "";
  const diff = Math.max(0, now - new Date(iso).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

export default function ShopAdminOrders() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : "";
  const [items, setItems] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    if (!shopId) return;
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, total, status, payment_status, delivery_address, shop_confirmed, created_at, order_items(quantity, price_at_purchase, products(name, image_url))"
      )
      .eq("shop_id", shopId)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) setMessage(error.message);
    setItems((data as any) ?? []);
    setRefreshing(false);
  }, [shopId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Live relative timestamps
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Realtime updates for this shop's paid orders
  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel(`shop-orders-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          load();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, load]);

  const confirmOrder = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ shop_confirmed: true, status: "processing" })
      .eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("Order confirmed.");
      load();
    }
  };

  const markDelivered = async (id: string) => {
    const { error } = await setOrderStatus(id, "delivered");
    if (error) setMessage(error.message);
    else {
      setMessage("Marked delivered.");
      load();
    }
  };

  const isNew = (o: Order) => !o.shop_confirmed && o.status !== "delivered";
  const isConfirmed = (o: Order) => !!o.shop_confirmed || o.status === "delivered" || o.status === "processing";

  const newOrders = items.filter(isNew);
  // Avoid double-listing: confirmed = not in new
  const confirmedOrders = items.filter((o) => !isNew(o));

  const renderCard = (o: Order, section: "new" | "confirmed") => {
    const lines = o.order_items ?? [];
    return (
      <View key={o.id} style={[styles.card, shadow.card]}>
        <View style={styles.cardTop}>
          <Text style={styles.id}>#{String(o.id).slice(0, 8)}</Text>
          <Text style={styles.ago}>{relativeTime(o.created_at, now)}</Text>
        </View>
        <Text style={styles.meta}>
          {o.delivery_address?.full_name || "Customer"}
          {o.delivery_address?.phone ? ` · ${o.delivery_address.phone}` : ""}
        </Text>
        {o.delivery_address?.location ? (
          <Text style={styles.loc} numberOfLines={2}>
            {o.delivery_address.location}
          </Text>
        ) : null}
        <Text style={styles.total}>{kwacha(o.total)}</Text>
        <View style={styles.pills}>
          <StatusPill status={o.status} />
        </View>

        {lines.length > 0 ? (
          <View style={styles.itemsBox}>
            {lines.map((line, idx) => (
              <View key={idx} style={styles.itemRow}>
                {line.products?.image_url ? (
                  <Image
                    source={{ uri: line.products.image_url }}
                    style={styles.itemThumb}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.itemThumb, { backgroundColor: colors.border }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {line.products?.name || "Product"}
                  </Text>
                  <Text style={styles.itemMeta}>
                    ×{line.quantity} · {kwacha(Number(line.price_at_purchase) * Number(line.quantity))}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.row}>
          {section === "new" ? (
            <Pressable style={styles.btn} onPress={() => confirmOrder(o.id)}>
              <Text style={styles.btnText}>Confirm order</Text>
            </Pressable>
          ) : o.status !== "delivered" ? (
            <Pressable style={styles.btn} onPress={() => markDelivered(o.id)}>
              <Text style={styles.btnText}>Mark delivered</Text>
            </Pressable>
          ) : (
            <Text style={styles.doneLabel}>Delivered</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <AdminShell title="Orders">
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
        {message ? <Text style={styles.msg}>{message}</Text> : null}

        <Text style={styles.section}>New orders</Text>
        {newOrders.length === 0 ? (
          <Text style={styles.emptySection}>No new paid orders</Text>
        ) : (
          newOrders.map((o) => renderCard(o, "new"))
        )}

        <Text style={[styles.section, { marginTop: spacing.lg }]}>Confirmed orders</Text>
        {confirmedOrders.length === 0 ? (
          <Text style={styles.emptySection}>No confirmed orders yet</Text>
        ) : (
          confirmedOrders.map((o) => renderCard(o, "confirmed"))
        )}

        {items.length === 0 ? (
          <EmptyState title="No paid orders" subtitle="Paid orders for your shop appear here." />
        ) : null}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  msg: { color: colors.primary, marginBottom: spacing.sm },
  section: {
    fontFamily: typography.bodyBold,
    fontSize: typography.small,
    color: colors.adminMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  emptySection: { color: colors.adminMuted, marginBottom: spacing.md, fontSize: typography.small },
  card: {
    backgroundColor: colors.adminCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { color: colors.adminText, fontFamily: typography.bodyBold },
  ago: { color: colors.adminMuted, fontSize: typography.tiny },
  meta: { color: colors.adminMuted, fontSize: typography.tiny, marginTop: 4 },
  loc: { color: colors.adminMuted, fontSize: typography.tiny, marginTop: 2 },
  total: { color: colors.primary, fontFamily: typography.bodyBold, marginVertical: 6 },
  pills: { flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" },
  itemsBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginBottom: 10,
    gap: 8,
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemThumb: { width: 40, height: 40, borderRadius: 6 },
  itemName: { fontFamily: typography.bodySemibold, color: colors.adminText, fontSize: typography.small },
  itemMeta: { color: colors.adminMuted, fontSize: typography.tiny, marginTop: 2 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  btnText: { color: "#fff", fontFamily: typography.bodySemibold, fontSize: typography.small },
  doneLabel: { color: colors.success, fontFamily: typography.bodySemibold },
});
