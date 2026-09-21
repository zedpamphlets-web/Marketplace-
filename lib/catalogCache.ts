/**
 * Offline catalog cache — stores products, shops, categories, banners, and
 * banner→product links so list screens can keep working without internet.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRODUCTS_KEY = "catalog_products_v2";
const SHOPS_KEY = "catalog_shops_v2";
const CATS_KEY = "catalog_categories_v2";
const BANNERS_KEY = "catalog_banners_v2";
const BANNER_LINKS_KEY = "catalog_banner_links_v2";
const MAX_PRODUCTS = 500;

export async function saveProductsCache(products: unknown[]) {
  try {
    await AsyncStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify({ at: Date.now(), products: products.slice(0, MAX_PRODUCTS) })
    );
  } catch {
    /* ignore */
  }
}

export async function readProductsCache<T = any>(): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.products) ? parsed.products : [];
  } catch {
    return [];
  }
}

/** Merge new products into cache (by id), keeping newest data. */
export async function mergeProductsCache(incoming: any[]) {
  try {
    const existing = await readProductsCache<any>();
    const map = new Map<string, any>();
    existing.forEach((p) => p?.id && map.set(p.id, p));
    incoming.forEach((p) => p?.id && map.set(p.id, p));
    const merged = Array.from(map.values()).slice(0, MAX_PRODUCTS);
    await saveProductsCache(merged);
    return merged;
  } catch {
    return incoming;
  }
}

export async function getCachedProductById(id: string): Promise<any | null> {
  const all = await readProductsCache<any>();
  return all.find((p) => p.id === id) ?? null;
}

export async function saveShopsCache(shops: unknown[]) {
  try {
    await AsyncStorage.setItem(SHOPS_KEY, JSON.stringify({ at: Date.now(), shops }));
  } catch {
    /* ignore */
  }
}

export async function readShopsCache<T = any>(): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(SHOPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.shops) ? parsed.shops : [];
  } catch {
    return [];
  }
}

export async function saveCategoriesCache(categories: unknown[]) {
  try {
    await AsyncStorage.setItem(CATS_KEY, JSON.stringify({ at: Date.now(), categories }));
  } catch {
    /* ignore */
  }
}

export async function readCategoriesCache<T = any>(): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(CATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.categories) ? parsed.categories : [];
  } catch {
    return [];
  }
}

export async function saveBannersCache(banners: unknown[]) {
  try {
    await AsyncStorage.setItem(BANNERS_KEY, JSON.stringify({ at: Date.now(), banners }));
  } catch {
    /* ignore */
  }
}

export async function readBannersCache<T = any>(): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(BANNERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.banners) ? parsed.banners : [];
  } catch {
    return [];
  }
}

/** Map of bannerId → productId[] */
export async function saveBannerLinksCache(links: Record<string, string[]>) {
  try {
    await AsyncStorage.setItem(BANNER_LINKS_KEY, JSON.stringify({ at: Date.now(), links }));
  } catch {
    /* ignore */
  }
}

export async function readBannerLinksCache(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(BANNER_LINKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.links && typeof parsed.links === "object" ? parsed.links : {};
  } catch {
    return {};
  }
}

export async function setBannerLinkCache(bannerId: string, productIds: string[]) {
  const links = await readBannerLinksCache();
  links[bannerId] = productIds;
  await saveBannerLinksCache(links);
}
