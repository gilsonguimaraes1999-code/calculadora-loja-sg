import assert from "node:assert/strict";
import test from "node:test";

const { validateManualUser } = await import("../src/lib/auth/manual-user.mjs");

test("normaliza um usuário manual aprovado criado pelo owner", () => {
  assert.deepEqual(
    validateManualUser({
      name: "  Maria Silva  ",
      email: "  MARIA@EXAMPLE.COM ",
      password: "senha-segura",
      passwordConfirmation: "senha-segura",
      role: "admin",
    }),
    {
      name: "Maria Silva",
      email: "maria@example.com",
      password: "senha-segura",
      role: "admin",
    },
  );
});

test("recusa dados inválidos na criação manual", () => {
  const valid = {
    name: "Maria Silva",
    email: "maria@example.com",
    password: "senha-segura",
    passwordConfirmation: "senha-segura",
    role: "member",
  };

  assert.throws(() => validateManualUser({ ...valid, name: " " }), /nome/i);
  assert.throws(() => validateManualUser({ ...valid, email: "maria" }), /e-mail válido/i);
  assert.throws(() => validateManualUser({ ...valid, password: "123" }), /8 caracteres/i);
  assert.throws(
    () => validateManualUser({ ...valid, passwordConfirmation: "outra-senha" }),
    /senhas não coincidem/i,
  );
  assert.throws(() => validateManualUser({ ...valid, role: "owner" }), /permissão inválida/i);
});
