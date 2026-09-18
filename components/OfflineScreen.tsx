import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { colors, typography } from "@/lib/theme";

async function pingOnline() {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://clients3.google.com/generate_204", {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(t);
    return res.ok || res.status === 204 || res.status === 0;
  } catch {
    return false;
  }
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    const ok = await pingOnline();
    setOnline(ok);
    setChecking(false);
    return ok;
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  }, [check]);

  return { online, checking, check };
}

export function OfflineScreen({ onRefresh, loading }: { onRefresh: () => void; loading?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.art}>
        <Svg width={88} height={88} viewBox="0 0 88 88">
          <Rect x="18" y="14" width="36" height="44" rx="6" fill="#374151" />
          <Rect x="26" y="24" width="20" height="16" rx="3" fill="#9CA3AF" />
          <Circle cx="32" cy="32" r="2.2" fill="#374151" />
          <Circle cx="40" cy="32" r="2.2" fill="#374151" />
          <Path d="M48 40c8 2 18 10 22 22" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" fill="none" />
          <Circle cx="70" cy="66" r="9" fill={colors.accent} />
          <Path d="M70 61v10M65 66h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </Svg>
      </View>
      <Text style={styles.title}>No internet connection</Text>
      <Text style={styles.sub}>You are currently offline. Check your internet{"\n"}settings to continue.</Text>
      <Pressable style={styles.btn} onPress={onRefresh} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Waiting..." : "Refresh"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  art: { marginBottom: 22 },
  title: {
    fontSize: 20,
    fontFamily: typography.displaySemibold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  sub: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
  },
  btn: {
    backgroundColor: colors.accent,
    minWidth: 220,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: typography.bodyBold },
});
