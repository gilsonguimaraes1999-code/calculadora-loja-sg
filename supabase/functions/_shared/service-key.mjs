function modernSecret(value) {
  if (!String(value || "").trim()) return "";
  try {
    const parsed = JSON.parse(value);
    const candidates = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
    return String(
      candidates.find(
        (candidate) => typeof candidate === "string" && candidate.startsWith("sb_secret_"),
      ) || "",
    );
  } catch {
    return String(value).startsWith("sb_secret_") ? String(value) : "";
  }
}

export function selectSupabaseServiceKey({ modern, legacy }) {
  const key = modernSecret(modern) || String(legacy || "").trim();
  if (!key) throw new Error("Chave administrativa do Supabase não configurada.");
  return key;
}
