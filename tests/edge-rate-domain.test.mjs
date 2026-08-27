import assert from "node:assert/strict";
import test from "node:test";

let buildAwesomeRequest;
let parseAwesomePayload;
let deriveAwesomeRate;
try {
  ({ buildAwesomeRequest, parseAwesomePayload, deriveAwesomeRate } =
    await import("../supabase/functions/awesome-rates/domain.mjs"));
} catch {
  // RED: o domínio da Edge Function será criado após esta falha.
}

test("chave AwesomeAPI fica somente no cabeçalho privado", () => {
  const request = buildAwesomeRequest(["BRL", "USD", "GBP", "USD"], "private-key");
  assert.equal(request.url, "https://economia.awesomeapi.com.br/json/last/USD-BRL,GBP-BRL");
  assert.equal(request.headers["x-api-key"], "private-key");
  assert.equal(request.url.includes("private-key"), false);
});

test("normaliza as cotações e deriva BRL para USD corretamente", () => {
  const parsed = parseAwesomePayload({
    USDBRL: { code: "USD", codein: "BRL", bid: "5.14", timestamp: "1787630400" },
  });
  assert.equal(parsed.rates.USD, 5.14);
  assert.equal(deriveAwesomeRate(parsed.rates, "BRL", "USD"), 1 / 5.14);
});
