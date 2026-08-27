import assert from "node:assert/strict";
import test from "node:test";

const ratesModule = await import("../src/lib/rates.server.ts");

function productionFunction(name) {
  const fn = ratesModule[name];
  assert.equal(typeof fn, "function", `${name} must be implemented`);
  return fn;
}

const awesomePayload = {
  USDBRL: {
    code: "USD",
    codein: "BRL",
    name: "Dólar Americano/Real Brasileiro",
    high: "5.10",
    low: "4.90",
    varBid: "0.01",
    pctChange: "0.2",
    bid: "5.00",
    ask: "5.01",
    timestamp: "1760000000",
    create_date: "2025-10-09 05:53:20",
  },
  EURBRL: {
    code: "EUR",
    codein: "BRL",
    name: "Euro/Real Brasileiro",
    high: "5.60",
    low: "5.40",
    varBid: "0.01",
    pctChange: "0.2",
    bid: "5.50",
    ask: "5.51",
    timestamp: "1760000060",
    create_date: "2025-10-09 05:54:20",
  },
  GBPBRL: {
    code: "GBP",
    codein: "BRL",
    name: "Libra Esterlina/Real Brasileiro",
    high: "6.60",
    low: "6.40",
    varBid: "0.01",
    pctChange: "0.2",
    bid: "6.50",
    ask: "6.51",
    timestamp: "1760000120",
    create_date: "2025-10-09 05:55:20",
  },
};

test("authenticates AwesomeAPI through the private header without leaking the key in the URL", () => {
  const buildAwesomeRequest = productionFunction("buildAwesomeRequest");
  const request = buildAwesomeRequest(["GBP", "BRL", "USD", "GBP"], "test-private-key");

  assert.equal(request.url, "https://economia.awesomeapi.com.br/json/last/GBP-BRL,USD-BRL");
  assert.deepEqual(request.headers, {
    Accept: "application/json",
    "x-api-key": "test-private-key",
  });
  assert.equal(request.url.includes("test-private-key"), false);
});

test("parses authenticated AwesomeAPI quotes into BRL reference rates", () => {
  const parseAwesomePayload = productionFunction("parseAwesomePayload");
  const parsed = parseAwesomePayload(awesomePayload);

  assert.deepEqual(parsed.rates, { BRL: 1, USD: 5, EUR: 5.5, GBP: 6.5 });
  assert.equal(parsed.updatedAt, new Date(1760000120 * 1000).toISOString());
});

test("derives direct and inverse BRL conversions", () => {
  const deriveAwesomeRate = productionFunction("deriveAwesomeRate");
  const rates = { BRL: 1, USD: 5, EUR: 5.5, GBP: 6.5 };

  assert.equal(deriveAwesomeRate(rates, "USD", "BRL"), 5);
  assert.equal(deriveAwesomeRate(rates, "BRL", "USD"), 0.2);
});

test("derives cross-currency conversions through BRL", () => {
  const deriveAwesomeRate = productionFunction("deriveAwesomeRate");
  const rates = { BRL: 1, USD: 5, EUR: 5.5, GBP: 6.5 };

  assert.equal(deriveAwesomeRate(rates, "GBP", "EUR"), 6.5 / 5.5);
  assert.equal(deriveAwesomeRate(rates, "EUR", "USD"), 1.1);
});
