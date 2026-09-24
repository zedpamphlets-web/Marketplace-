import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { BagLogo, ShopTroryWordmark } from "@/components/BrandMark";
import { colors, radius, typography } from "@/lib/theme";

const { width: W, height: H } = Dimensions.get("window");

type Props = { onDone: () => void };

function Dots({ index }: { index: number }) {
  return (
    <View style={styles.dots}>
      <View style={[styles.dot, index === 0 && styles.dotOn]} />
      <View style={[styles.dot, index === 1 && styles.dotOn]} />
    </View>
  );
}

function GoldButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}>
      <Text style={styles.ctaText}>{label}</Text>
      <Text style={styles.ctaArrow}>→</Text>
    </Pressable>
  );
}

function SplashOne({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.light}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.brandBlock}>
          <BagLogo size={56} />
          <ShopTroryWordmark size={34} />
          <Text style={styles.tag}>Shop Smarter  ·  Live Better</Text>
        </View>

        <View style={styles.copy} />

        <View style={styles.heroWrap}>
          <View style={styles.podium} />
          <Image source={require("../assets/splash-products.jpg")} style={styles.heroImg} resizeMode="contain" />
        </View>

        <View style={styles.footer}>
          <GoldButton label="Get Started" onPress={onNext} />
          <Dots index={0} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function SplashTwo({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.dark}>
      <Image source={require("../assets/splash-rider.jpg")} style={styles.bgPhoto} resizeMode="cover" />
      <View style={styles.darkScrim} />
      <View style={styles.blobBRDark} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.fastSafe}>
          <Text style={styles.script}>Fast</Text>
          <Text style={styles.script}>Safe</Text>
          <Text style={styles.script}>Reliable</Text>
          <View style={styles.scriptLine} />
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.darkCopy}>
          <View style={styles.pinRow}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"
                fill={colors.primary}
              />
              <Circle cx="12" cy="10" r="2.4" fill="#111" />
            </Svg>
          </View>
          <Text style={styles.h1Dark}>
            Your Order,{"\n"}
            <Text style={{ color: colors.primary }}>Our Ride</Text>
          </Text>
          <Text style={styles.subDark}>
            Get your favorite products delivered{"\n"}quickly and safely, right to your door.
          </Text>

          <View style={styles.feats}>
            <Feat icon="shield" label={"Safe\nDelivery"} />
            <View style={styles.featDiv} />
            <Feat icon="clock" label={"On-Time\nArrival"} />
            <View style={styles.featDiv} />
            <Feat icon="pin" label={"Live\nTracking"} />
          </View>

          <GoldButton label="Continue" onPress={onNext} />
          <Dots index={1} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Feat({ icon, label }: { icon: "shield" | "clock" | "pin"; label: string }) {
  return (
    <View style={styles.feat}>
      <View style={styles.featIcon}>
        {icon === "shield" ? (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3l8 3v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6l8-3z" stroke={colors.primary} strokeWidth={1.8} />
            <Path d="M9 12l2 2 4-4" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
        ) : icon === "clock" ? (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="8" stroke={colors.primary} strokeWidth={1.8} />
            <Path d="M12 8v4l3 2" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
        ) : (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 21s6-5.6 6-10a6 6 0 1 0-12 0c0 4.4 6 10 6 10z" stroke={colors.primary} strokeWidth={1.8} />
            <Circle cx="12" cy="11" r="2" fill={colors.primary} />
          </Svg>
        )}
      </View>
      <Text style={styles.featLabel}>{label}</Text>
    </View>
  );
}

export default function WelcomeScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);
  if (step === 0) return <SplashOne onNext={() => setStep(1)} />;
  return <SplashTwo onNext={onDone} />;
}

const styles = StyleSheet.create({
  light: { flex: 1, backgroundColor: "#FFFFFF" },
  dark: { flex: 1, backgroundColor: "#0B0B0B" },
  safe: { flex: 1 },
  blobTL: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#FFE27A",
    opacity: 0.85,
  },
  blobBR: {
    position: "absolute",
    bottom: -40,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#FFD54A",
    opacity: 0.55,
  },
  blobBRDark: {
    position: "absolute",
    bottom: -30,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primary,
    opacity: 0.28,
  },
  brandBlock: { alignItems: "center", paddingTop: 18, gap: 4 },
  tag: {
    marginTop: 4,
    color: colors.textMuted,
    letterSpacing: 1.6,
    fontSize: 11,
    textTransform: "uppercase",
    fontFamily: typography.bodyMedium,
  },
  copy: { paddingHorizontal: 28, marginTop: 18 },
  h1: {
    fontFamily: typography.displayFont,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  h1Gold: { color: colors.primary },
  sub: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.bodyFont,
  },
  heroWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end", marginTop: 8 },
  podium: {
    position: "absolute",
    bottom: 8,
    width: W * 0.72,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F0E8",
  },
  heroImg: { width: W * 0.9, height: H * 0.38 },
  footer: { paddingHorizontal: 24, paddingBottom: 10, paddingTop: 8 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    color: colors.onPrimary,
    fontFamily: typography.bodyBold,
    fontSize: 17,
  },
  ctaArrow: { color: colors.onPrimary, fontSize: 18, fontFamily: typography.bodyBold },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#D1D5DB" },
  dotOn: { backgroundColor: colors.primary, width: 16 },
  bgPhoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  darkScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  fastSafe: { alignItems: "flex-end", paddingRight: 22, paddingTop: 12 },
  script: {
    color: "#fff",
    fontFamily: typography.displayFont,
    fontSize: 28,
    lineHeight: 32,
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowRadius: 6,
  },
  scriptLine: {
    marginTop: 4,
    width: 54,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  darkCopy: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    backgroundColor: "rgba(8,8,8,0.55)",
    paddingTop: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  pinRow: { alignItems: "center", marginBottom: 6 },
  h1Dark: {
    textAlign: "center",
    color: "#fff",
    fontFamily: typography.displayFont,
    fontSize: 32,
    lineHeight: 38,
  },
  subDark: {
    textAlign: "center",
    color: "rgba(255,255,255,0.82)",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  feats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginVertical: 18,
  },
  feat: { alignItems: "center", flex: 1, gap: 8 },
  featIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  featLabel: {
    textAlign: "center",
    color: "#fff",
    fontSize: 11,
    lineHeight: 14,
    fontFamily: typography.bodyMedium,
  },
  featDiv: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.18)" },
});
