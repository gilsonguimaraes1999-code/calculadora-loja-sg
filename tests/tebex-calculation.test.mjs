import assert from "node:assert/strict";
import test from "node:test";

const { calculateTebex } = await import("../src/lib/domain/tebex.ts");

const convert = (value, from, to) => {
  if (from === to) return { value };
  const rate = from === "BRL" && to === "USD" ? 0.2 : 1;
  return {
    value: value * rate,
    quote: {
      from,
      to,
      rate,
      source: "Manual",
      updatedAt: "2026-08-22T00:00:00.000Z",
    },
  };
};

test("converte o HUB BRL para USD antes de aplicar o multiplicador TEBEX", () => {
  const result = calculateTebex({
    hub: 100,
    moeda: "BRL",
    discountPercentage: 0,
    multiplier: 1.7,
    arredondar: false,
    convert,
  });

  assert.equal(result.value, 34);
  assert.equal(result.moeda, "USD");
  assert.equal(result.quote?.from, "BRL");
  assert.equal(result.quote?.to, "USD");
});

test("multiplica o valor HUB na moeda da cidade quando ela não usa BRL", () => {
  const result = calculateTebex({
    hub: 100,
    moeda: "GBP",
    discountPercentage: 0,
    multiplier: 1.7,
    arredondar: false,
    convert,
  });

  assert.equal(result.value, 170);
  assert.equal(result.moeda, "GBP");
});

test("mantém o valor quando o multiplicador TEBEX está vazio", () => {
  const result = calculateTebex({
    hub: 100,
    moeda: "GBP",
    discountPercentage: 0,
    multiplier: null,
    arredondar: false,
    convert,
  });

  assert.equal(result.value, 100);
  assert.equal(result.moeda, "GBP");
});

test("aplica o multiplicador ao valor líquido depois do desconto da cidade", () => {
  const result = calculateTebex({
    hub: 100 / 0.7,
    moeda: "GBP",
    discountPercentage: 30,
    multiplier: 1.7,
    arredondar: false,
    convert,
  });

  assert.equal(result.baseValue, 100);
  assert.equal(result.value, 170);
});
