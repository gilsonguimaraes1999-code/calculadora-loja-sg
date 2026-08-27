import assert from "node:assert/strict";
import test from "node:test";

import { assertUserCanBeDeleted, removeUserSessions } from "../src/lib/auth/user-deletion.mjs";

test("permite apagar usuários comuns e protege a conta owner", () => {
  assert.doesNotThrow(() => assertUserCanBeDeleted({ id: "user-1", role: "user" }));
  assert.throws(
    () => assertUserCanBeDeleted({ id: "owner-1", role: "owner" }),
    /owner não pode ser excluída/i,
  );
  assert.throws(() => assertUserCanBeDeleted(undefined), /não encontrado/i);
});

test("remove todas as sessões do usuário excluído e preserva as demais", () => {
  assert.deepEqual(
    removeUserSessions(
      {
        "token-a": "user-1",
        "token-b": "user-2",
        "token-c": "user-1",
      },
      "user-1",
    ),
    { "token-b": "user-2" },
  );
});
