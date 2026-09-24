import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOnline } from "@/components/OfflineScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import { colors } from "@/lib/theme";

const WELCOME_SEEN_KEY = "shoptrory_welcome_seen_v1";

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("App error:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#111" }}>Something went wrong</Text>
          <Text style={{ textAlign: "center", color: "#6B7280", marginBottom: 20 }}>
            ShopTrory hit an error. Try again to continue shopping.
          </Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24 }}
          >
            <Text style={{ color: "#111", fontWeight: "700" }}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

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
  const [showWelcome, setShowWelcome] = useState(false);
  const net = useOnline();

  useEffect(() => {
    async function prepare() {
      try {
        const seen = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
        setShowWelcome(seen !== "1");
      } catch (e) {
        console.warn("Startup setup error:", e);
        setShowWelcome(false);
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
        <WelcomeScreen
          onDone={() => {
            AsyncStorage.setItem(WELCOME_SEEN_KEY, "1").catch(() => {});
            setShowWelcome(false);
          }}
        />
      </View>
    );
  }

  return (
    <RootErrorBoundary>
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
    </RootErrorBoundary>
  );
}
