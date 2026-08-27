export function resolveBackendConfig(input?: {
  useLocalDemo?: string;
  backend?: string;
  endpoint?: string;
}): { mode: "local" | "supabase"; endpoint: null };

export function selectBackend<T>(input: {
  config: { mode: "local" | "supabase"; endpoint: null };
  localBackend: T;
  supabaseBackend: T;
}): T;
