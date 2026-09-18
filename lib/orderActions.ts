import { supabase } from "@/lib/supabase";

export async function setOrderPayment(orderId: string, payment_status: "paid" | "unpaid") {
  return supabase.from("orders").update({ payment_status }).eq("id", orderId);
}

export async function setOrderStatus(orderId: string, status: "processing" | "delivered" | "new") {
  return supabase.from("orders").update({ status }).eq("id", orderId);
}
