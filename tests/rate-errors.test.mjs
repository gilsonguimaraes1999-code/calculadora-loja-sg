import assert from "node:assert/strict";
import test from "node:test";

const { friendlyRateError } = await import("../src/lib/domain/rate-errors.mjs");

test("nunca expõe erros técnicos da consulta de cotação", () => {
  assert.equal(
    friendlyRateError(new Error("fetch failed")),
    "Cotação indisponível. Atualize ou utilize o modo manual.",
  );
  assert.equal(
    friendlyRateError(new Error("AwesomeAPI respondeu 401")),
    "Cotação indisponível. Atualize ou utilize o modo manual.",
  );
});
