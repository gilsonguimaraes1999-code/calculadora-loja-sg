export function resolveSupabaseEnv(env?: {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}): { url: string; publishableKey: string };
