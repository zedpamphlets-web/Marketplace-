import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export async function fetchSupportEmail(): Promise<string> {
  const { data } = await supabase
    .from("settings")
    .select("support_email")
    .eq("id", "global")
    .maybeSingle();
  return (data?.support_email || "").trim();
}

export function useSupportEmail() {
  const [email, setEmail] = useState("");
  useEffect(() => {
    fetchSupportEmail().then(setEmail).catch(() => setEmail(""));
  }, []);
  return email;
}
