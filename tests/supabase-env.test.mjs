import assert from "node:assert/strict";
import test from "node:test";

let resolveSupabaseEnv;
try {
  ({ resolveSupabaseEnv } = await import("../src/lib/supabase/env.mjs"));
} catch {
  // RED: o módulo será criado depois que esta suíte provar o contrato desejado.
}

test("recusa configuração pública ausente do Supabase", () => {
  assert.throws(() => resolveSupabaseEnv({}), /VITE_SUPABASE_URL/);
});

test("aceita somente a URL e a chave publicável do Supabase", () => {
  assert.deepEqual(
    resolveSupabaseEnv({
      VITE_SUPABASE_URL: "https://project.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    }),
    {
      url: "https://project.supabase.co",
      publishableKey: "sb_publishable_test",
    },
  );
});

test("recusa chave secreta no bundle do navegador", () => {
  assert.throws(
    () =>
      resolveSupabaseEnv({
        VITE_SUPABASE_URL: "https://project.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "service_role_test",
      }),
    /publicável/,
  );
});
