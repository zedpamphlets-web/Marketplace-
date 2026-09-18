import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { SectionHeader, PrimaryButton } from "@/components/Shared";

export default function RiderScreen() {
  const [online, setOnline] = useState(true);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.riderLabel}>Rider mode</Text>
            <Text style={styles.title}>Hi, Joseph</Text>
          </View>
          <View style={styles.onlineToggle}>
            <Text style={styles.onlineLabel}>{online ? "Online" : "Offline"}</Text>
            <Switch value={online} onValueChange={setOnline} trackColor={{ true: colors.success }} />
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statLabel}>DELIVERIES TODAY</Text>
            <Text style={styles.statValue}>7</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statLabel}>EARNED TODAY</Text>
            <Text style={styles.statValue}>K126</Text>
          </View>
        </View>

        <SectionHeader title="New delivery request" />
        <View style={[styles.requestCard, shadow.card]}>
          <View style={styles.requestTop}>
            <View>
              <Text style={styles.requestShop}>Mwana Fresh Grocers</Text>
              <Text style={styles.requestSub}>Pickup · Kabulonga</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.payout}>K12.00</Text>
              <Text style={styles.payoutLabel}>payout</Text>
            </View>
          </View>
          <Text style={styles.distanceRow}>📍 2.1 km pickup · 🏁 3.4 km drop-off</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.declineBtn}>
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Accept" onPress={() => {}} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  riderLabel: { fontSize: typography.small, color: colors.textMuted },
  title: { fontSize: typography.h1, fontFamily: typography.displayFont, color: colors.text },
  onlineToggle: { alignItems: "center" },
  onlineLabel: { fontSize: typography.tiny, color: colors.textMuted, marginBottom: 4 },
  statRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  statLabel: { fontSize: 10, color: colors.textFaint, fontFamily: typography.bodySemibold, marginBottom: 8 },
  statValue: { fontSize: 22, fontFamily: typography.displayFont, color: colors.text },
  requestCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  requestTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  requestShop: { fontSize: typography.body, fontFamily: typography.bodyBold, color: colors.text },
  requestSub: { fontSize: typography.tiny, color: colors.textMuted, marginTop: 2 },
  payout: { fontSize: typography.body, fontFamily: typography.bodyBold, color: colors.accent },
  payoutLabel: { fontSize: typography.tiny, color: colors.textMuted },
  distanceRow: { fontSize: typography.tiny, color: colors.textMuted, marginBottom: spacing.lg },
  actionRow: { flexDirection: "row", gap: spacing.md },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  declineText: { color: colors.textMuted, fontFamily: typography.bodySemibold },
});
