/** Preset icons admins can assign to categories (no upload required). */
export const CATEGORY_ICON_PRESETS: { key: string; emoji: string; label: string }[] = [
  { key: "fashion", emoji: "👗", label: "Fashion" },
  { key: "electronics", emoji: "📱", label: "Electronics" },
  { key: "headphones", emoji: "🎧", label: "Audio" },
  { key: "home", emoji: "🏠", label: "Home" },
  { key: "garden", emoji: "🌿", label: "Garden" },
  { key: "food", emoji: "🍎", label: "Food" },
  { key: "beauty", emoji: "💄", label: "Beauty" },
  { key: "health", emoji: "💊", label: "Health" },
  { key: "sports", emoji: "⚽", label: "Sports" },
  { key: "kids", emoji: "🧸", label: "Kids" },
  { key: "shoes", emoji: "👟", label: "Shoes" },
  { key: "bags", emoji: "👜", label: "Bags" },
  { key: "jewelry", emoji: "💍", label: "Jewelry" },
  { key: "furniture", emoji: "🪑", label: "Furniture" },
  { key: "tools", emoji: "🔧", label: "Tools" },
  { key: "auto", emoji: "🚗", label: "Auto" },
  { key: "pets", emoji: "🐾", label: "Pets" },
  { key: "office", emoji: "📎", label: "Office" },
  { key: "gift", emoji: "🎁", label: "Gifts" },
  { key: "phone", emoji: "☎️", label: "Phones" },
  { key: "watch", emoji: "⌚", label: "Watches" },
  { key: "camera", emoji: "📷", label: "Camera" },
  { key: "kitchen", emoji: "🍳", label: "Kitchen" },
  { key: "clean", emoji: "🧴", label: "Care" },
];

export function emojiForCategory(icon?: string | null, iconUrl?: string | null): string {
  if (iconUrl) return ""; // image takes priority in UI
  if (!icon) return "🛒";
  const found = CATEGORY_ICON_PRESETS.find((p) => p.key === icon || p.emoji === icon);
  if (found) return found.emoji;
  // allow raw emoji stored in icon column
  if (icon.length <= 4) return icon;
  return "🛒";
}
