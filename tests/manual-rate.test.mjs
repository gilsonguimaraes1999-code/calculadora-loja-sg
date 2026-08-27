import assert from "node:assert/strict";
import test from "node:test";

const { manualRateInput, manualRateForPair } = await import("../src/lib/domain/manual-rate.ts");

test("solicita reais por dólar ao converter BRL para USD", () => {
  assert.deepEqual(manualRateInput("BRL", "USD"), {
    from: "USD",
    to: "BRL",
    inverted: true,
  });
});

test("inverte a cotação comercial para converter BRL em USD", () => {
  const rate = manualRateForPair("BRL", "USD", "5,14");

  assert.ok(Math.abs(rate - 1 / 5.14) < 1e-12);
  assert.ok(Math.abs(143 * rate - 27.82101167315175) < 1e-12);
  assert.equal(Math.ceil(143 * rate), 28);
});

test("mantém a direção informada quando o par não precisa ser invertido", () => {
  assert.deepEqual(manualRateInput("USD", "BRL"), {
    from: "USD",
    to: "BRL",
    inverted: false,
  });
  assert.equal(manualRateForPair("USD", "BRL", 5.14), 5.14);
});
