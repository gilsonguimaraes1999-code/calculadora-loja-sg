import { localDemoBackend } from "./local-demo";
import type { Backend } from "./types";
import { resolveBackendConfig, selectBackend } from "./config.mjs";
import { supabaseBackend } from "./supabase";

const backendConfig = resolveBackendConfig({
  useLocalDemo: import.meta.env.VITE_USE_LOCAL_DEMO,
  backend: import.meta.env.VITE_BACKEND,
});
export const backend = selectBackend<Backend>({
  config: backendConfig,
  localBackend: localDemoBackend,
  supabaseBackend,
});
