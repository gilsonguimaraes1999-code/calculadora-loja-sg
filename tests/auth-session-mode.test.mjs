import assert from "node:assert/strict";
import test from "node:test";

let usesCustomToken;
try {
  ({ usesCustomToken } = await import("../src/lib/auth/session-mode.mjs"));
} catch {
  // RED: a estratégia será criada após esta falha.
}

test("sessão Supabase nunca duplica token no localStorage da aplicação", () => {
  assert.equal(usesCustomToken("native"), false);
});

test("modo de demonstração local mantém token próprio", () => {
  assert.equal(usesCustomToken("custom"), true);
  assert.equal(usesCustomToken(undefined), true);
});
