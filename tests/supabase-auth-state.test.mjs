import assert from "node:assert/strict";
import test from "node:test";

let accessState;
try {
  ({ accessState } = await import("../src/lib/auth/auth-state.mjs"));
} catch {
  // RED: o classificador será criado depois deste contrato falhar.
}

test("perfil aprovado e ativo recebe acesso autenticado", () => {
  assert.equal(accessState({ status: "approved", active: true }), "authenticated");
});

test("sessão válida não libera um perfil pendente", () => {
  assert.equal(accessState({ status: "pending", active: true }), "pending");
});

test("perfil rejeitado permanece rejeitado", () => {
  assert.equal(accessState({ status: "rejected", active: true }), "rejected");
});

test("perfil inativo nunca recebe acesso à calculadora", () => {
  assert.equal(accessState({ status: "approved", active: false }), "inactive");
});
