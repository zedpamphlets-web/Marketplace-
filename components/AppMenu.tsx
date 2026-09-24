import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import { BagLogo, ShopTroryWordmark } from "@/components/BrandMark";
import { useUserRole, type UserRole } from "@/lib/useUserRole";
import { supabase } from "@/lib/supabase";

const MENU_WIDTH = Math.min(320, Dimensions.get("window").width * 0.85);

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  route?: string;
  action?: () => void;
};

type MenuSection = {
  title?: string;
  items: MenuItem[];
};

function Icon({ name, color = colors.text }: { name: string; color?: string }) {
  const s = 18;
  const stroke = color;
  switch (name) {
    case "home":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Path d="M3 9.5 12 3l9 6.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 10v10h5v-6h4v6h5V10" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "dashboard":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Rect x="3" y="3" width="7" height="9" rx="1" />
          <Rect x="14" y="3" width="7" height="5" rx="1" />
          <Rect x="14" y="12" width="7" height="9" rx="1" />
          <Rect x="3" y="16" width="7" height="5" rx="1" />
        </Svg>
      );
    case "products":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <Path d="M3.3 7 12 12l8.7-5M12 22V12" />
        </Svg>
      );
    case "footer":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Rect x="3" y="3" width="18" height="18" rx="2" />
          <Path d="M3 15h18" />
        </Svg>
      );
    case "shops":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Path d="M3 9l1-5h16l1 5" strokeLinecap="round" />
          <Path d="M4 9v11h16V9" />
          <Path d="M9 20v-6h6v6" />
        </Svg>
      );
    case "banners":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Rect x="3" y="5" width="18" height="14" rx="2" />
          <Path d="M3 15l5-4 4 3 4-5 5 6" />
        </Svg>
      );
    case "promotions":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 8v4l3 2" strokeLinecap="round" />
        </Svg>
      );
    case "edit":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Path d="M12 20h9" />
          <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </Svg>
      );
    case "revenue":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v10M9 10h4.5a1.5 1.5 0 0 1 0 3H9.5a1.5 1.5 0 0 0 0 3H15" strokeLinecap="round" />
        </Svg>
      );
    case "create":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </Svg>
      );
    case "invite":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Circle cx="9" cy="8" r="3.5" />
          <Path d="M3 20c1-4 3.5-6 6-6s5 2 6 6" />
          <Path d="M19 8v6M16 11h6" strokeLinecap="round" />
        </Svg>
      );
    case "settings":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </Svg>
      );
    case "categories":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Rect x="3" y="3" width="7" height="7" rx="1" />
          <Rect x="14" y="3" width="7" height="7" rx="1" />
          <Rect x="3" y="14" width="7" height="7" rx="1" />
          <Rect x="14" y="14" width="7" height="7" rx="1" />
        </Svg>
      );
    case "cart":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Circle cx="9" cy="20" r="1.4" />
          <Circle cx="18" cy="20" r="1.4" />
          <Path d="M2 3h2l2.4 12.6a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6" />
        </Svg>
      );
    case "orders":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Rect x="5" y="4" width="14" height="17" rx="2" />
          <Path d="M9 8h6M9 12h6M9 16h3" />
        </Svg>
      );
    case "heart":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </Svg>
      );
    case "user":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Circle cx="12" cy="8" r="3.5" />
          <Path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" />
        </Svg>
      );
    case "help":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M9.1 9a3 3 0 1 1 4.9 2.3c-.7.6-1.2 1-1.5 1.7M12 17h.01" strokeLinecap="round" />
        </Svg>
      );
    case "about":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </Svg>
      );
    case "logout":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2}>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <Path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "close":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.2}>
          <Path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

function buildSections(role: UserRole): MenuSection[] {
  if (role.type === "super_admin") {
    return [
      {
        title: "DASHBOARD",
        items: [
          { key: "dash", label: "Dashboard", icon: <Icon name="dashboard" />, route: "/admin" },
        ],
      },
      {
        title: "MANAGE",
        items: [
          { key: "orders", label: "Orders", icon: <Icon name="orders" />, route: "/admin/orders" },
          { key: "products", label: "Products", icon: <Icon name="products" />, route: "/admin/products" },
          { key: "categories", label: "Categories", icon: <Icon name="categories" />, route: "/admin/categories" },
          { key: "banners", label: "Banners", icon: <Icon name="banners" />, route: "/admin/banners" },
          { key: "shops", label: "Shops", icon: <Icon name="shops" />, route: "/admin/shops" },
          { key: "revenue", label: "Revenue", icon: <Icon name="revenue" />, route: "/admin/revenue" },
        ],
      },
      {
        title: "SETTINGS",
        items: [
          { key: "create-shop", label: "Create shop", icon: <Icon name="create" />, route: "/admin/create-shop" },
          { key: "invite-admin", label: "Invite admin", icon: <Icon name="invite" />, route: "/admin/invite-admin" },
          { key: "shop-control", label: "Delivery fee", icon: <Icon name="settings" />, route: "/admin/shop-control" },
          { key: "footer", label: "Footer / email", icon: <Icon name="footer" />, route: "/admin/footer" },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          { key: "account", label: "My Account", icon: <Icon name="user" />, route: "/(tabs)/profile" },
          {
            key: "signout",
            label: "Sign Out",
            icon: <Icon name="logout" color={colors.danger} />,
            action: async () => {
              await supabase.auth.signOut();
              router.replace("/auth/login");
            },
          },
        ],
      },
    ];
  }

  if (role.type === "shop_admin") {
    return [
      {
        title: "DASHBOARD",
        items: [
          { key: "dash", label: "Dashboard", icon: <Icon name="dashboard" />, route: "/shop-admin" },
        ],
      },
      {
        title: "EDIT APP + USERS",
        items: [
          { key: "orders", label: "Orders", icon: <Icon name="orders" />, route: "/shop-admin/orders" },
          { key: "products", label: "Products", icon: <Icon name="products" />, route: "/shop-admin/products" },
          { key: "riders", label: "Riders", icon: <Icon name="user" />, route: "/shop-admin/riders" },
        ],
      },
      {
        title: "MANAGE SHOP",
        items: [
          { key: "edit-shop", label: "Edit Shop", icon: <Icon name="edit" />, route: "/shop-admin/edit" },
          { key: "prices", label: "Shop Prices", icon: <Icon name="revenue" />, route: "/shop-admin/prices" },
          { key: "revenue", label: "Total Revenue", icon: <Icon name="revenue" />, route: "/shop-admin/revenue" },
        ],
      },
      {
        title: "SETTINGS",
        items: [
          { key: "shop-control", label: "Shop Control", icon: <Icon name="settings" />, route: "/shop-admin/control" },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          { key: "account", label: "My Account", icon: <Icon name="user" />, route: "/(tabs)/profile" },
          {
            key: "signout",
            label: "Sign Out",
            icon: <Icon name="logout" color={colors.danger} />,
            action: async () => {
              await supabase.auth.signOut();
              router.replace("/auth/login");
            },
          },
        ],
      },
    ];
  }

  // Customer / Guest
  return [
    {
      items: [
        { key: "home", label: "Home", icon: <Icon name="home" />, route: "/(tabs)" },
        { key: "shops", label: "Shops", icon: <Icon name="shops" />, route: "/(tabs)" },
        { key: "products", label: "Products", icon: <Icon name="products" />, route: "/(tabs)" },
        { key: "categories", label: "Categories", icon: <Icon name="categories" />, route: "/(tabs)" },
        { key: "promos", label: "Promotions", icon: <Icon name="promotions" />, route: "/(tabs)" },
      ],
    },
    {
      items: [
        { key: "cart", label: "My Cart", icon: <Icon name="cart" />, route: "/(tabs)/cart" },
        { key: "orders", label: "My Orders", icon: <Icon name="orders" />, route: "/(tabs)/orders" },
      ],
    },
    {
      items: [
      ],
    },
    {
      items: [
        { key: "account", label: "My Account", icon: <Icon name="user" />, route: "/(tabs)/profile" },
      ],
    },
    {
      items: [
        { key: "about", label: "About", icon: <Icon name="about" />, route: "/(tabs)/profile" },
        {
          key: "signout",
          label: role.type === "guest" ? "Sign In" : "Sign Out",
          icon: <Icon name="logout" color={role.type === "guest" ? colors.primary : colors.danger} />,
          action: async () => {
            if (role.type === "guest") {
              router.push("/auth/login");
            } else {
              await supabase.auth.signOut();
              router.replace("/auth/login");
            }
          },
        },
      ],
    },
  ];
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AppMenu({ visible, onClose }: Props) {
  const role = useUserRole();
  const sections = buildSections(role);

  const title =
    role.type === "super_admin"
      ? "Supa Admin"
      : role.type === "shop_admin"
        ? "Shop Admin"
        : "Menu";

  const handleItem = (item: MenuItem) => {
    onClose();
    if (item.action) {
      item.action();
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <SafeAreaView style={styles.drawer} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <BagLogo size={32} />
              <View>
                <ShopTroryWordmark size={18} />
                <Text style={styles.headerTitle}>{title}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Icon name="close" color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section, idx) => (
              <View key={idx} style={styles.section}>
                {section.title ? (
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                ) : null}
                {section.items.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => handleItem(item)}
                    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                  >
                    <View style={styles.itemIcon}>{item.icon}</View>
                    <Text
                      style={[
                        styles.itemLabel,
                        item.key === "signout" && role.type !== "guest" && { color: colors.danger },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: typography.bodyMedium,
    color: colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: typography.bodyBold,
    color: colors.textFaint,
    letterSpacing: 0.6,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  itemPressed: {
    backgroundColor: colors.bg,
  },
  itemIcon: {
    width: 24,
    alignItems: "center",
  },
  itemLabel: {
    flex: 1,
    fontSize: typography.body,
    fontFamily: typography.bodyMedium,
    color: colors.text,
  },
});
