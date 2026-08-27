import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const routePath = new URL("src/routes/index.tsx", root);
const stylesPath = new URL("src/styles.css", root);
const starfieldPath = new URL("src/components/brand/StarfieldBackground.tsx", root);
const shellPath = new URL("src/components/layout/AppShell.tsx", root);
const loginPath = new URL("src/routes/login.tsx", root);

test("mounts the animated starfield from the main calculator", () => {
  assert.equal(existsSync(starfieldPath), true, "StarfieldBackground component must exist");

  const shell = readFileSync(shellPath, "utf8");
  const starfield = readFileSync(starfieldPath, "utf8");
  assert.match(shell, /import \{ StarfieldBackground \}/);
  assert.match(shell, /<StarfieldBackground density=\{0\.7\}/);
  assert.match(starfield, /fixed inset-0 z-0/);
  assert.doesNotMatch(starfield, /fixed inset-0 -z-10/);
});

test("uses the main calculator dark gold design instead of the static dotted background", () => {
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(styles, /--primary:\s*#d4af37/);
  assert.match(styles, /font-family:\s*['\"]Inter['\"]/);
  assert.doesNotMatch(styles, /background-size:\s*120px 120px/);
});

test("mantém as estrelas sem halos ou círculos luminosos no fundo", () => {
  const starfield = readFileSync(starfieldPath, "utf8");

  assert.doesNotMatch(starfield, /radial-gradient/);
  assert.doesNotMatch(starfield, /radius \* 3\.4/);
  assert.doesNotMatch(starfield, /alpha \* 0\.08/);
});

test("moves settings to a page and keeps modal effects out of the calculator", () => {
  const route = readFileSync(routePath, "utf8");
  const styles = readFileSync(stylesPath, "utf8");

  assert.doesNotMatch(route, /className="modal-quiet/);
  assert.doesNotMatch(route, /settingsOpen/);
  assert.doesNotMatch(route, /shadow-2xl/);
  assert.match(styles, /\.modal-quiet\s*\{[^}]*box-shadow:\s*none/s);
});

test("mantém o preenchimento automático escuro e permite visualizar a senha", () => {
  const login = readFileSync(loginPath, "utf8");
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(styles, /input:-webkit-autofill/);
  assert.match(styles, /-webkit-text-fill-color:\s*var\(--color-foreground\)/);
  assert.match(login, /showPassword \? "text" : "password"/);
  assert.match(login, /aria-label=\{showPassword \? "Ocultar senha" : "Mostrar senha"\}/);
  assert.match(login, /"current-password"/);
});
