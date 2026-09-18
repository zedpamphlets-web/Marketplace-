export type ProductBadgeId =
  | "verified"
  | "top_seller"
  | "popular"
  | "new"
  | "best_price"
  | "sale"
  | "limited"
  | "fast_delivery"
  | "trusted_shop"
  | "live";

export type ProductBadge = {
  id: ProductBadgeId;
  label: string;
  icon: string;
  bg: string;
  fg: string;
};

export const PRODUCT_BADGES: ProductBadge[] = [
  { id: "verified", label: "Verified", icon: "✓", bg: "#2563EB", fg: "#FFFFFF" },
  { id: "top_seller", label: "Top Seller", icon: "♛", bg: "#F59E0B", fg: "#FFFFFF" },
  { id: "popular", label: "Popular", icon: "🔥", bg: "#EF4444", fg: "#FFFFFF" },
  { id: "new", label: "New", icon: "✦", bg: "#16A34A", fg: "#FFFFFF" },
  { id: "best_price", label: "Best Price", icon: "🏷", bg: "#7C3AED", fg: "#FFFFFF" },
  { id: "sale", label: "Sale", icon: "%", bg: "#DC2626", fg: "#FFFFFF" },
  { id: "limited", label: "Limited", icon: "⏱", bg: "#334155", fg: "#FFFFFF" },
  { id: "fast_delivery", label: "Fast Delivery", icon: "🚚", bg: "#2563EB", fg: "#FFFFFF" },
  { id: "trusted_shop", label: "Trusted Shop", icon: "🛡", bg: "#F59E0B", fg: "#111827" },
  { id: "live", label: "LIVE", icon: "●", bg: "#EF4444", fg: "#FFFFFF" },
];

export function badgesFromIds(ids?: string[] | null): ProductBadge[] {
  if (!ids?.length) return [];
  const map = new Map(PRODUCT_BADGES.map((b) => [b.id, b]));
  return ids.map((id) => map.get(id as ProductBadgeId)).filter(Boolean) as ProductBadge[];
}
