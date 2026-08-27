import assert from "node:assert/strict";
import test from "node:test";

const domain = await import("../src/lib/domain/city-rules.ts");

test("preço-base usa a moeda configurada na cidade", () => {
  assert.equal(domain.inputCurrencyForMode("A", "BRL", "GBP"), "BRL");
  assert.equal(domain.inputCurrencyForMode("A", "GBP", "BRL"), "GBP");
});

test("valor final mantém a moeda escolhida pelo usuário", () => {
  assert.equal(domain.inputCurrencyForMode("B", "BRL", "USD"), "USD");
});
