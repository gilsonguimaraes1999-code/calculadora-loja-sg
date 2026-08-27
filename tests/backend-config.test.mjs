import assert from "node:assert/strict";
import test from "node:test";

let backendConfig = {};
try {
  backendConfig = await import("../src/lib/backend/config.mjs");
} catch {
  // A primeira execução deve falhar até a configuração existir.
}

test("usa o Supabase quando a variável de build não foi configurada", () => {
  assert.deepEqual(backendConfig.resolveBackendConfig?.({}), {
    mode: "supabase",
    endpoint: null,
  });
});

test("ativa o backend local somente quando solicitado explicitamente", () => {
  assert.deepEqual(backendConfig.resolveBackendConfig?.({ useLocalDemo: "true" }), {
    mode: "local",
    endpoint: null,
  });
});

test("seleciona o Supabase quando não existe arquivo .env", () => {
  assert.equal(typeof backendConfig.selectBackend, "function");
  const localBackend = { name: "local" };
  const supabaseBackend = { name: "supabase" };
  const selected = backendConfig.selectBackend({
    config: backendConfig.resolveBackendConfig({}),
    localBackend,
    supabaseBackend,
  });

  assert.equal(selected, supabaseBackend);
});

test("ignora uma configuração de backend antiga e mantém o Supabase", () => {
  assert.deepEqual(
    backendConfig.resolveBackendConfig?.({
      backend: "legacy",
      endpoint: "https://legacy.invalid/exec",
    }),
    {
      mode: "supabase",
      endpoint: null,
    },
  );

  const supabaseBackend = { name: "supabase" };
  const selected = backendConfig.selectBackend({
    config: backendConfig.resolveBackendConfig({ backend: "legacy" }),
    localBackend: { name: "local" },
    supabaseBackend,
  });

  assert.equal(selected, supabaseBackend);
});
