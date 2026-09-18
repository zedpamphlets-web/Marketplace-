import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, typography } from "@/lib/theme";

export type FulfillmentStatus = "new" | "processing" | "preparing" | "out_for_delivery" | "delivered";
export type PaymentStatus = "pending" | "unpaid" | "paid" | "failed";

const FULFILLMENT: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: colors.statusNewBg, text: colors.statusNewText },
  processing: { label: "Processing", bg: colors.statusPrepBg, text: colors.statusPrepText },
  preparing: { label: "Processing", bg: colors.statusPrepBg, text: colors.statusPrepText },
  out_for_delivery: { label: "On the way", bg: colors.statusOutBg, text: colors.statusOutText },
  delivered: { label: "Delivered", bg: colors.statusDoneBg, text: colors.statusDoneText },
};

const PAYMENT: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Unpaid", bg: colors.statusUnpaidBg, text: colors.statusUnpaidText },
  unpaid: { label: "Unpaid", bg: colors.statusUnpaidBg, text: colors.statusUnpaidText },
  paid: { label: "Paid", bg: colors.statusPaidBg, text: colors.statusPaidText },
  failed: { label: "Failed", bg: colors.statusUnpaidBg, text: colors.statusUnpaidText },
};

export function StatusPill({ status }: { status: string }) {
  const s = FULFILLMENT[status] || FULFILLMENT.new;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

export function PaymentPill({ status }: { status?: string | null }) {
  const key = (status || "pending").toLowerCase();
  const s = PAYMENT[key] || PAYMENT.pending;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: typography.tiny,
    fontFamily: typography.bodyBold,
  },
});
