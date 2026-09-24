/**
 * Page 1 — Delivery details (Namecheap-style step).
 * Verifies province, district, area, phone, then continues to payment.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { colors, spacing, radius, typography, shadow } from "@/lib/theme";
import { readCart, type CartLine } from "@/lib/cart";
import { toZambianMsisdn } from "@/lib/lipila";

const PROVINCES = [
  "Central",
  "Copperbelt",
  "Eastern",
  "Luapula",
  "Lusaka",
  "Muchinga",
  "Northern",
  "North-Western",
  "Southern",
  "Western",
] as const;

const DISTRICTS: Record<(typeof PROVINCES)[number], string[]> = {
  Central: ["Kabwe", "Kapiri Mposhi", "Mkushi", "Mumbwa", "Serenje", "Chibombo", "Chisamba"],
  Copperbelt: ["Ndola", "Kitwe", "Chingola", "Mufulira", "Luanshya", "Kalulushi", "Chililabombwe"],
  Eastern: ["Chipata", "Katete", "Lundazi", "Petauke", "Nyimba", "Chadiza"],
  Luapula: ["Mansa", "Samfya", "Kawambwa", "Nchelenge", "Mwense"],
  Lusaka: ["Lusaka", "Kafue", "Chongwe", "Luangwa", "Chilanga"],
  Muchinga: ["Chinsali", "Mpika", "Isoka", "Nakonde"],
  Northern: ["Kasama", "Mbala", "Mpulungu", "Mungwi", "Luwingu"],
  "North-Western": ["Solwezi", "Kasempa", "Mwinilunga", "Zambezi"],
  Southern: ["Livingstone", "Choma", "Mazabuka", "Monze", "Kalomo", "Siavonga"],
  Western: ["Mongu", "Senanga", "Kaoma", "Sesheke", "Lukulu"],
};

function DropdownField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  disabled,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.dropdown, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && setOpen(true)}
      >
        <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.chev}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function CheckoutDeliveryScreen() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      readCart().then(setLines);
      setVerified(false);
    }, [])
  );

  const districtOptions = useMemo(() => {
    if (!province || !(province in DISTRICTS)) return [];
    return DISTRICTS[province as (typeof PROVINCES)[number]];
  }, [province]);

  const onProvince = (p: string) => {
    setProvince(p);
    setDistrict("");
    setVerified(false);
  };

  const verify = () => {
    setMessage("");
    if (!lines.length) {
      setMessage("Your cart is empty.");
      return;
    }
    if (!province) {
      setMessage("Select a province.");
      return;
    }
    if (!district) {
      setMessage("Select a district.");
      return;
    }
    if (!area.trim()) {
      setMessage("Enter your area and plot number.");
      return;
    }
    if (!phone.trim()) {
      setMessage("Enter your phone number.");
      return;
    }
    const msisdn = toZambianMsisdn(phone);
    if (msisdn.length < 12) {
      setMessage("Enter a valid Zambian phone number.");
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 600);
  };

  const continueToPay = () => {
    if (!verified) {
      setMessage("Please verify your delivery details first.");
      return;
    }
    const location = `${area.trim()}, ${district}, ${province}`;
    router.push({
      pathname: "/pay",
      params: {
        province,
        district,
        area: area.trim(),
        phone: toZambianMsisdn(phone),
        location,
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Delivery details</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.steps}>
        <View style={[styles.stepDot, styles.stepOn]} />
        <View style={styles.stepLine} />
        <View style={styles.stepDot} />
      </View>
      <Text style={styles.stepLabel}>Step 1 of 2 · Where should we deliver?</Text>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, shadow.card]}>
          <DropdownField
            label="Province"
            value={province}
            placeholder="Select province"
            options={[...PROVINCES]}
            onSelect={onProvince}
          />
          <DropdownField
            label="District"
            value={district}
            placeholder={province ? "Select district" : "Select province first"}
            options={districtOptions}
            onSelect={(d) => {
              setDistrict(d);
              setVerified(false);
            }}
            disabled={!province}
          />
          <View style={styles.field}>
            <Text style={styles.label}>Area / plot number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Plot 12, Kamwala"
              placeholderTextColor={colors.textFaint}
              value={area}
              onChangeText={(t) => {
                setArea(t);
                setVerified(false);
              }}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="0977 123 456"
              placeholderTextColor={colors.textFaint}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setVerified(false);
              }}
              keyboardType="phone-pad"
            />
          </View>

          {message ? <Text style={styles.error}>{message}</Text> : null}

          <Pressable
            style={[styles.verifyBtn, verified && styles.verifyDone]}
            onPress={verified ? undefined : verify}
            disabled={verifying}
          >
            <Text style={styles.verifyText}>
              {verifying ? "Verifying…" : verified ? "✓ Verified" : "Verify"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.cartHint}>
          {lines.length} item{lines.length === 1 ? "" : "s"} in cart
        </Text>

        <Pressable
          style={[styles.continueBtn, !verified && styles.continueOff]}
          onPress={continueToPay}
          disabled={!verified}
        >
          <Text style={styles.continueText}>Continue to payment</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { fontSize: 32, color: colors.text, width: 28, lineHeight: 36 },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.displaySemibold,
    fontSize: typography.h3,
    color: colors.text,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.md,
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  stepOn: { backgroundColor: colors.primary },
  stepLine: { width: 48, height: 2, backgroundColor: colors.border },
  stepLabel: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: 8,
    marginBottom: 4,
  },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { marginBottom: spacing.md },
  label: {
    fontFamily: typography.bodySemibold,
    fontSize: typography.small,
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
    backgroundColor: colors.bg,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.bg,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownDisabled: { opacity: 0.5 },
  dropdownValue: { flex: 1, color: colors.text, fontSize: typography.body },
  dropdownPlaceholder: { flex: 1, color: colors.textFaint, fontSize: typography.body },
  chev: { color: colors.textMuted, fontSize: 14 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: "70%",
  },
  modalTitle: {
    fontFamily: typography.bodyBold,
    fontSize: typography.body,
    marginBottom: 8,
    color: colors.text,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: typography.body, color: colors.text },
  error: { color: colors.danger, marginBottom: 8, fontSize: typography.small },
  verifyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  verifyDone: { backgroundColor: colors.success },
  verifyText: { color: colors.onPrimary, fontFamily: typography.bodyBold, fontSize: typography.body },
  cartHint: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: typography.small,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueOff: { opacity: 0.45 },
  continueText: { color: colors.onPrimary, fontFamily: typography.bodyBold, fontSize: typography.body },
});
