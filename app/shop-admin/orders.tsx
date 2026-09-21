import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { EmptyState } from "@/components/Shared";
import { PaymentPill, StatusPill } from "@/components/StatusPill";
import { useUserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";
import { kwacha } from "@/lib/adminActions";
import { setOrderPayment, setOrderStatus } from "@/lib/orderActions";

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
  order_items?: OrderItem[];
};

export default function ShopAdminOrders() {
  const role = useUserRole();
  const shopId = role.type === "shop_admin" ? role.shopId : "";
  const [items, setItems] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!shopId) return;
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, total, status, payment_status, delivery_address, order_items(quantity, price_at_purchase, products(name, image_url))"
      )
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) setMessage(error.message);
    setItems((data as any) ?? []);
    setRefreshing(false);
  }, [shopId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const markPay = async (id: string, payment_status: "paid" | "unpaid") => {
    const { error } = await setOrderPayment(id, payment_status);
    setMessage(error ? error.message : payment_status === "paid" ? "Marked paid." : "Marked unpaid.");
    load();
  };

  const markStatus = async (id: string, status: "processing" | "delivered") => {
    const { error } = await setOrderStatus(id, status);
    setMessage(error ? error.message : status === "delivered" ? "Marked delivered." : "Marked processing.");
    load();
  };

  const deleteOrder = (id: string) => {
    Alert.alert("Delete order?", "This unpaid order will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("order_items").delete().eq("order_id", id);
          const { error } = await supabase.from("orders").delete().eq("id", id);
          if (error) setMessage(error.message);
          else {
            setMessage("Order deleted.");
            load();
          }
        },
      },
    ]);
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
        {items.length === 0 ? (
          <EmptyState title="No orders" subtitle="Orders for your shop appear here." />
        ) : (
          items.map((o) => {
            const unpaid =
              !o.payment_status ||
              o.payment_status === "unpaid" ||
              o.payment_status === "pending";
            const lines = o.order_items ?? [];
            return (
              <View key={o.id} style={[styles.card, shadow.card]}>
                <Text style={styles.id}>#{String(o.id).slice(0, 8)}</Text>
                <Text style={styles.meta}>
                  {o.delivery_address?.full_name || "Customer"}
                  {o.delivery_address?.phone ? ` · ${o.delivery_address.phone}` : ""}
                </Text>
                <Text style={styles.total}>{kwacha(o.total)}</Text>
                <View style={styles.pills}>
                  <PaymentPill status={o.payment_status} />
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
                  <Pressable style={styles.btn} onPress={() => markPay(o.id, "paid")}>
                    <Text style={styles.btnText}>Mark paid</Text>
                  </Pressable>
                  <Pressable style={styles.btn} onPress={() => markStatus(o.id, "processing")}>
                    <Text style={styles.btnText}>Processing</Text>
                  </Pressable>
                  <Pressable style={styles.btn} onPress={() => markStatus(o.id, "delivered")}>
                    <Text style={styles.btnText}>Delivered</Text>
                  </Pressable>
                  {unpaid ? (
                    <Pressable style={styles.btnDanger} onPress={() => deleteOrder(o.id)}>
                      <Text style={styles.btnText}>Delete</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  msg: { color: colors.primary, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.adminCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  id: { color: colors.adminText, fontFamily: typography.bodyBold, marginBottom: 4 },
  meta: { color: colors.adminMuted, fontSize: typography.tiny, marginBottom: 4 },
  total: { color: colors.primary, fontFamily: typography.bodyBold, marginBottom: 8 },
  pills: { flexDirection: "row", gap: 6, marginBottom: 10, flexWrap: "wrap" },
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  btnText: { color: "#fff", fontFamily: typography.bodySemibold, fontSize: typography.small },
  btnDanger: {
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
});
