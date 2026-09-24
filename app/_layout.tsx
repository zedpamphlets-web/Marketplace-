import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { useOnline } from "@/components/OfflineScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import { colors } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore if already hidden */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const net = useOnline();

  useEffect(() => {
    async function prepare() {
      try {
        // startup only — no network calls here
      } catch (e) {
        console.warn("Startup setup error:", e);
      } finally {
        setReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (ready && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready, fontsLoaded, fontError]);

  if (!ready || (!fontsLoaded && !fontError)) {
    return null;
  }

  if (showWelcome) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <WelcomeScreen onDone={() => setShowWelcome(false)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {!net.online ? (
        <View style={{ backgroundColor: colors.primaryMuted, paddingVertical: 8, paddingHorizontal: 16 }}>
          <Text style={{ color: "#7A5608", textAlign: "center", fontSize: 12 }}>
            Offline — banners and shops stay available
          </Text>
        </View>
      ) : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="auth/email" />
        <Stack.Screen name="auth/onboarding" />
        <Stack.Screen name="shop/[id]" />
        <Stack.Screen name="category/[name]" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="addresses" />
        <Stack.Screen name="history" />
        <Stack.Screen name="deals" />
        <Stack.Screen name="pages/about" />
        <Stack.Screen name="pages/legal" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="pay" />
        <Stack.Screen name="track/[id]" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="shop-admin" />
        <Stack.Screen name="rider" />
      </Stack>
    </View>
  );
}
