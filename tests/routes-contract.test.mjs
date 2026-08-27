import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const root = new URL("../", import.meta.url);

test("oferece as quatro páginas reais e elimina o modal de configurações", () => {
  for (const file of ["login.tsx", "dashboard.tsx", "configuracao.tsx", "usuarios.tsx"])
    assert.equal(existsSync(new URL(`src/routes/${file}`, root)), true, file);
  const calculator = readFileSync(new URL("src/routes/index.tsx", root), "utf8");
  const citySettings = readFileSync(new URL("src/components/calc/CitySettings.tsx", root), "utf8");
  assert.doesNotMatch(calculator, /settingsOpen|modal-quiet|Preço do vendedor/);
  assert.doesNotMatch(citySettings, /Preço do vendedor/);
  assert.match(calculator, /sm:grid-cols-\[1\.2fr_0\.8fr\]/);
});

test("expõe o gerenciamento de função somente na página de usuários", () => {
  const users = readFileSync(new URL("src/routes/usuarios.tsx", root), "utf8");
  const shell = readFileSync(new URL("src/components/layout/AppShell.tsx", root), "utf8");
  assert.match(users, /backend\.updateUserRole/);
  assert.match(users, /Administrador/);
  assert.match(users, /Membro/);
  assert.match(shell, /role === "admin"/);
});

test("consulta cotações autenticadas e permite atualização forçada sem expor erros técnicos", () => {
  const calculator = readFileSync(new URL("src/routes/index.tsx", root), "utf8");
  const ratesHook = readFileSync(new URL("src/lib/domain/useRates.ts", root), "utf8");
  const backend = readFileSync(new URL("src/lib/backend/supabase.ts", root), "utf8");
  const panel = readFileSync(new URL("src/components/calc/RatesPanel.tsx", root), "utf8");

  assert.match(calculator, /useRates\(pairs, token\)/);
  assert.match(ratesHook, /backend\.getRates\(token, pairs, \{ fresh \}\)/);
  assert.doesNotMatch(ratesHook, /useServerFn|fetchRates/);
  assert.match(backend, /getRates.*functionCall\("awesome-rates"/s);
  assert.doesNotMatch(panel, />\{erro\}</);
});
