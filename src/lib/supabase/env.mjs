function requireValue(value, name) {
  const normalized = String(value || "").trim();
  if (!normalized) throw new Error(`${name} não foi configurada.`);
  return normalized;
}

export function resolveSupabaseEnv(env = {}) {
  const url = requireValue(env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL");
  const publishableKey = requireValue(
    env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  );

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("VITE_SUPABASE_URL deve ser uma URL válida.");
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co"))
    throw new Error("VITE_SUPABASE_URL deve usar HTTPS e o domínio supabase.co.");

  if (/service[_-]?role|secret/i.test(publishableKey))
    throw new Error("Use somente a chave publicável do Supabase no navegador.");

  return { url: parsed.toString().replace(/\/$/, ""), publishableKey };
}
