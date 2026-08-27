import assert from "node:assert/strict";
import test from "node:test";

let selectSupabaseServiceKey;
try {
  ({ selectSupabaseServiceKey } = await import("../supabase/functions/_shared/service-key.mjs"));
} catch {
  // RED: implementado depois do contrato falhar.
}

test("prefere uma chave secreta moderna do dicionário do Supabase", () => {
  assert.equal(
    selectSupabaseServiceKey({
      modern: JSON.stringify({ default: "sb_secret_modern" }),
      legacy: "legacy-service-role",
    }),
    "sb_secret_modern",
  );
});

test("mantém compatibilidade com a service role legada", () => {
  assert.equal(
    selectSupabaseServiceKey({ modern: "", legacy: "legacy-service-role" }),
    "legacy-service-role",
  );
});

test("recusa configuração sem chave administrativa", () => {
  assert.throws(
    () => selectSupabaseServiceKey({ modern: "{}", legacy: "" }),
    /chave administrativa/i,
  );
});
