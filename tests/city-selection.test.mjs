import assert from "node:assert/strict";
import test from "node:test";

const { normalizeCitySelections } = await import("../src/lib/domain/city-selection.ts");

test("remove todas as seleções quando não existem cidades cadastradas", () => {
  assert.deepEqual(
    normalizeCitySelections([], {
      cityId: "kng",
      originId: "kng",
      destinationId: "royal",
    }),
    { cityId: "", originId: "", destinationId: "" },
  );
});

test("mantém seleções válidas e substitui apenas cidades inexistentes", () => {
  const cities = [{ id: "santa" }, { id: "nobre" }];
  assert.deepEqual(
    normalizeCitySelections(cities, {
      cityId: "nobre",
      originId: "removida",
      destinationId: "removida",
    }),
    { cityId: "nobre", originId: "santa", destinationId: "nobre" },
  );
});
