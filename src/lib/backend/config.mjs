export function resolveBackendConfig({ useLocalDemo } = {}) {
  if (String(useLocalDemo).trim().toLowerCase() === "true")
    return { mode: "local", endpoint: null };
  return { mode: "supabase", endpoint: null };
}

export function selectBackend({ config, localBackend, supabaseBackend }) {
  if (config.mode === "local") return localBackend;
  return supabaseBackend;
}
