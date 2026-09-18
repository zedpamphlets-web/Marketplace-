import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "home_products_cache_v1";
const META_KEY = "home_shell_cache_v1";

export async function saveHomeProductsCache(products: unknown[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ at: Date.now(), products: products.slice(0, 24) }));
  } catch {
    /* ignore */
  }
}

export async function readHomeProductsCache<T = any>(): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.products) ? parsed.products : [];
  } catch {
    return [];
  }
}

export async function saveHomeShellCache(shell: {
  shops: unknown[];
  categories: unknown[];
  banners: unknown[];
}) {
  try {
    await AsyncStorage.setItem(META_KEY, JSON.stringify({ at: Date.now(), ...shell }));
  } catch {
    /* ignore */
  }
}

export async function readHomeShellCache(): Promise<{
  shops: any[];
  categories: any[];
  banners: any[];
} | null> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      shops: parsed.shops ?? [],
      categories: parsed.categories ?? [],
      banners: parsed.banners ?? [],
    };
  } catch {
    return null;
  }
}
