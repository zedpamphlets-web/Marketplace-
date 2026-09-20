import { Tabs } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { colors, typography } from "@/lib/theme";

function TabIcon({ name, color }: { name: string; color: string }) {
  const size = 24;
  switch (name) {
    case "home":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9.5 12 3l9 6.5" />
          <Path d="M5 10v10h5v-6h4v6h5V10" />
        </Svg>
      );
    case "categories":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
          <Rect x="3" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" />
        </Svg>
      );
    case "cart":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="9" cy="20" r="1.4" />
          <Circle cx="18" cy="20" r="1.4" />
          <Path d="M2 3h2l2.4 12.6a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6" />
        </Svg>
      );
    case "profile":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
          <Circle cx="12" cy="8" r="3.5" />
          <Path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" />
        </Svg>
      );
    default:
      return null;
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontSize: typography.tiny,
          fontFamily: typography.bodySemibold,
          marginTop: 2,
        },
        tabBarStyle: {
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
          paddingBottom: 10,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color }) => <TabIcon name="categories" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => <TabIcon name="cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />,
        }}
      />
      {/* Hidden routes — still reachable via router.push */}
      <Tabs.Screen name="orders" options={{ href: null }} />
      {/* wallet removed */}
    </Tabs>
  );
}
