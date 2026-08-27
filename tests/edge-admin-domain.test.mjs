import assert from "node:assert/strict";
import test from "node:test";

let assertOwnerAction;
try {
  ({ assertOwnerAction } = await import("../supabase/functions/admin-users/domain.mjs"));
} catch {
  // RED: a regra privilegiada será criada depois desta falha.
}

test("member nunca executa administração de usuários", () => {
  assert.throws(
    () =>
      assertOwnerAction({
        caller: { role: "member", status: "approved", active: true },
        action: "create",
      }),
    /owner/,
  );
});

test("owner aprovado pode criar um usuário", () => {
  assert.doesNotThrow(() =>
    assertOwnerAction({
      caller: { role: "owner", status: "approved", active: true },
      action: "create",
    }),
  );
});

test("nenhuma ação administrativa exclui a conta owner", () => {
  assert.throws(
    () =>
      assertOwnerAction({
        caller: { role: "owner", status: "approved", active: true },
        action: "delete",
        target: { role: "owner" },
      }),
    /não pode ser excluída/,
  );
});
