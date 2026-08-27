import assert from "node:assert/strict";
import test from "node:test";

let friendlySupabaseError;
try {
  ({ friendlySupabaseError } = await import("../src/lib/supabase/errors.mjs"));
} catch {
  // RED: a tradução será criada depois que o contrato falhar.
}

test("não exibe mensagem técnica de credencial inválida", () => {
  assert.equal(
    friendlySupabaseError({ message: "Invalid login credentials" }),
    "E-mail ou senha inválidos.",
  );
});

test("não exibe erro técnico de rede", () => {
  assert.equal(
    friendlySupabaseError(new TypeError("fetch failed")),
    "Não foi possível conectar ao servidor. Tente novamente.",
  );
});

test("traduz bloqueio de permissão sem revelar política interna", () => {
  assert.equal(
    friendlySupabaseError({ code: "42501", message: "new row violates row-level security policy" }),
    "Você não tem permissão para realizar esta ação.",
  );
});
