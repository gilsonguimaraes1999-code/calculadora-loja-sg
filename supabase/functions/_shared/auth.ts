import { createClient } from "npm:@supabase/supabase-js@2";
import { selectSupabaseServiceKey } from "./service-key.mjs";

function required(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} não configurada.`);
  return value;
}

export function adminClient() {
  const serviceKey = selectSupabaseServiceKey({
    modern: Deno.env.get("SUPABASE_SECRET_KEYS"),
    legacy: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  });
  return createClient(required("SUPABASE_URL"), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function authenticatedProfile(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Sessão ausente.");
  const admin = adminClient();
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Sessão inválida.");
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,name,email,role,status,active")
    .eq("id", authData.user.id)
    .single();
  if (profileError || !profile) throw new Error("Perfil não encontrado.");
  return { admin, user: authData.user, profile };
}
