import assert from "node:assert/strict";
import test from "node:test";

let isPasswordRecoveryUrl;
try {
  ({ isPasswordRecoveryUrl } = await import("../src/lib/auth/password-recovery.mjs"));
} catch {
  // RED: implementado depois do contrato falhar.
}

test("reconhece apenas o retorno de recuperação solicitado pelo site", () => {
  assert.equal(isPasswordRecoveryUrl("https://site.example/login?mode=recovery&code=abc"), true);
  assert.equal(isPasswordRecoveryUrl("https://site.example/login?code=abc"), false);
  assert.equal(isPasswordRecoveryUrl("https://site.example/login"), false);
});
