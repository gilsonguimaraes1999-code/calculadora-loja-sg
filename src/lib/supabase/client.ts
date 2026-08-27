import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveSupabaseEnv } from "./env.mjs";

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (browserClient) return browserClient;
  const { url, publishableKey } = resolveSupabaseEnv(import.meta.env);
  browserClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}
