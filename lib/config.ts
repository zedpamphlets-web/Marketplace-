import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const PAYMENT_API_URL =
  extra.paymentApiUrl ||
  process.env.EXPO_PUBLIC_PAYMENT_API_URL ||
  "";

export const paymentEndpoints = {
  createPayment: PAYMENT_API_URL
    ? `${PAYMENT_API_URL.replace(/\/$/, "")}/create-payment`
    : "",
  verifyPayment: PAYMENT_API_URL
    ? `${PAYMENT_API_URL.replace(/\/$/, "")}/verify-payment`
    : "",
};
