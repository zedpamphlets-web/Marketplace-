import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const PAYMENT_API_URL =
  extra.paymentApiUrl ||
  process.env.EXPO_PUBLIC_PAYMENT_API_URL ||
  "https://lgrkckhpgjwxzllqxoot.supabase.co/functions/v1";

export const CREATE_PAYMENT_URL = `${PAYMENT_API_URL.replace(/\/$/, "")}/create-payment`;
export const VERIFY_PAYMENT_URL = `${PAYMENT_API_URL.replace(/\/$/, "")}/verify-payment`;

export const paymentEndpoints = {
  createPayment: CREATE_PAYMENT_URL,
  verifyPayment: VERIFY_PAYMENT_URL,
};
