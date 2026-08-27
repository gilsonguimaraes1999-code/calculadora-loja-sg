import assert from "node:assert/strict";
import test from "node:test";

const { canAccessRoute, reviewButtons, usesVectorBackground } =
  await import("../src/lib/auth/guards.ts");

test("protege páginas administrativas por função", () => {
  const member = { role: "member", approved: true, status: "approved", active: true };
  const admin = { ...member, role: "admin" };
  const owner = { ...member, role: "owner" };
  assert.equal(canAccessRoute(null, "/dashboard"), false);
  assert.equal(canAccessRoute(member, "/dashboard"), true);
  assert.equal(canAccessRoute(member, "/configuracao"), false);
  assert.equal(canAccessRoute(admin, "/configuracao"), true);
  assert.equal(canAccessRoute(admin, "/usuarios"), false);
  assert.equal(canAccessRoute(admin, "/usuarios/novo"), false);
  assert.equal(canAccessRoute(owner, "/configuracao"), true);
  assert.equal(canAccessRoute(owner, "/usuarios"), true);
  assert.equal(canAccessRoute(owner, "/usuarios/novo"), true);
});

test("habilita ações conforme o histórico da solicitação", () => {
  assert.deepEqual(reviewButtons("pending"), { approve: true, reject: true });
  assert.deepEqual(reviewButtons("rejected"), { approve: true, reject: false });
  assert.deepEqual(reviewButtons("approved"), { approve: false, reject: true });
  assert.deepEqual(reviewButtons("approved", "owner"), { approve: false, reject: false });
});

test("usa o fundo vetorial somente nas quatro páginas autenticadas solicitadas", () => {
  for (const pathname of ["/dashboard", "/configuracao", "/usuarios", "/usuarios/novo"])
    assert.equal(usesVectorBackground?.(pathname), true, pathname);

  for (const pathname of ["/", "/login", "/usuarios/novo/detalhes"])
    assert.equal(usesVectorBackground?.(pathname), false, pathname);
});
