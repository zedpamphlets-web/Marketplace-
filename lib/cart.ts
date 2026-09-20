import AsyncStorage from "@react-native-async-storage/async-storage";

export type CartLine = {
  id: string;
  name: string;
  shopName: string;
  price: number;
  qty: number;
  image_url?: string | null;
  shop_id?: string;
};

const KEY = "mall_cart_v1";

export async function readCart(): Promise<CartLine[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function writeCart(lines: CartLine[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(lines));
}

export async function addToCart(item: Omit<CartLine, "qty">, qty = 1) {
  const cart = await readCart();
  const existing = cart.find((l) => l.id === item.id);
  const add = Math.max(1, qty);
  const next = existing
    ? cart.map((l) => (l.id === item.id ? { ...l, qty: l.qty + add } : l))
    : [...cart, { ...item, qty: add }];
  await writeCart(next);
  return next;
}
