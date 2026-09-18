import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useRequireRole } from "@/lib/useUserRole";
import { colors } from "@/lib/theme";

export default function RiderLayout() {
  const { loaded, allowed } = useRequireRole(["rider", "super_admin"]);

  if (!loaded || !allowed) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.adminBg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
