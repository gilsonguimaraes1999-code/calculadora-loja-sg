import assert from "node:assert/strict";
import test from "node:test";

const domain = await import("../src/lib/domain/city-rules.ts");
const { cityRecomposicao, normalizeCity } = domain;

test("calcula sempre a recomposição pela fórmula inversa do desconto", () => {
  assert.equal(cityRecomposicao({ desconto: 20 }), 25);
  assert.ok(Math.abs(cityRecomposicao({ desconto: 30 }) - 42.85714285714286) < 1e-10);
});

test("migra cidades antigas sem multiplicador e sem recomposição manual", () => {
  const city = normalizeCity({
    id: "santa",
    nome: "Santa",
    moeda: "BRL",
    desconto: 30,
    recomposicao: 43,
  });

  assert.deepEqual(city, {
    id: "santa",
    nome: "Santa",
    moeda: "BRL",
    desconto: 30,
    tebexMultiplier: null,
  });
});

test("preserva o multiplicador TEBEX somente na cidade onde foi configurado", () => {
  const city = normalizeCity({
    id: "kng",
    nome: "KNG",
    moeda: "GBP",
    desconto: 20,
    tebexMultiplier: 1.7,
  });
  assert.equal(city.tebexMultiplier, 1.7);
  assert.equal(normalizeCity({ ...city, id: "royal", tebexMultiplier: "" }).tebexMultiplier, null);
});

test("migra o antigo campo de taxa para multiplicador sem reinterpretar 1,7 como porcentagem", () => {
  const city = normalizeCity({
    id: "kng",
    nome: "KNG",
    moeda: "GBP",
    desconto: 20,
    tebexFeePercentage: 1.7,
  });

  assert.equal(city.tebexMultiplier, 1.7);
});

test("normaliza toda configuração importada do sistema antigo", () => {
  assert.equal(typeof domain.normalizeCities, "function");
  assert.deepEqual(
    domain.normalizeCities([
      {
        id: "nobre",
        nome: "Nobre",
        moeda: "BRL",
        desconto: 30,
        tebexFeePercentage: null,
      },
    ]),
    [
      {
        id: "nobre",
        nome: "Nobre",
        moeda: "BRL",
        desconto: 30,
        tebexMultiplier: null,
      },
    ],
  );
});
