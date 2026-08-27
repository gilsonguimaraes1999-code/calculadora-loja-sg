import assert from "node:assert/strict";
import test from "node:test";

const domain = await import("../src/lib/domain/city-rules.ts");

const saved = [
  {
    id: "kng",
    nome: "KNG",
    moeda: "GBP",
    desconto: 20,
    tebexMultiplier: 1.7,
  },
  {
    id: "nobre",
    nome: "Nobre",
    moeda: "BRL",
    desconto: 30,
    tebexMultiplier: null,
  },
];

test("identifica cidades alteradas, adicionadas e removidas", () => {
  const drafts = [
    {
      id: "kng",
      nome: "KNG",
      moeda: "GBP",
      desconto: "25",
      tebexMultiplier: "1,7",
    },
    {
      id: "prime",
      nome: "Prime",
      moeda: "BRL",
      desconto: "0",
      tebexMultiplier: "",
    },
  ];

  assert.deepEqual(domain.configurationChanges(saved, drafts), [
    { id: "kng", name: "KNG", type: "updated" },
    { id: "prime", name: "Prime", type: "added" },
    { id: "nobre", name: "Nobre", type: "removed" },
  ]);
});

test("converte os rascunhos visíveis para cidades persistíveis", () => {
  assert.deepEqual(
    domain.draftsToCities([
      {
        id: "kng",
        nome: "KNG",
        moeda: "GBP",
        desconto: "20,5",
        tebexMultiplier: "1,7",
      },
      {
        id: "nobre",
        nome: "Nobre",
        moeda: "BRL",
        desconto: "30",
        tebexMultiplier: "",
      },
    ]),
    [
      {
        id: "kng",
        nome: "KNG",
        moeda: "GBP",
        desconto: 20.5,
        tebexMultiplier: 1.7,
      },
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

test("impede salvar rascunhos inválidos", () => {
  assert.throws(
    () =>
      domain.draftsToCities([
        {
          id: "kng",
          nome: "KNG",
          moeda: "GBP",
          desconto: "100",
          tebexMultiplier: "",
        },
      ]),
    /desconto inválido em KNG/i,
  );
});

test("move uma cidade para cima ou para baixo sem alterar os demais dados", () => {
  const drafts = saved.map(domain.cityToDraft);

  assert.deepEqual(
    domain.moveCityDraft(drafts, "nobre", "up").map((city) => city.id),
    ["nobre", "kng"],
  );
  assert.deepEqual(
    domain.moveCityDraft(drafts, "kng", "down").map((city) => city.id),
    ["nobre", "kng"],
  );
});

test("mantém a ordem ao tentar ultrapassar os limites da lista", () => {
  const drafts = saved.map(domain.cityToDraft);

  assert.deepEqual(
    domain.moveCityDraft(drafts, "kng", "up").map((city) => city.id),
    ["kng", "nobre"],
  );
  assert.deepEqual(
    domain.moveCityDraft(drafts, "nobre", "down").map((city) => city.id),
    ["kng", "nobre"],
  );
});

test("considera a mudança de ordem como alteração salvável", () => {
  const reordered = saved.slice().reverse().map(domain.cityToDraft);

  assert.deepEqual(domain.configurationChanges(saved, reordered), [
    { id: "nobre", name: "Nobre", type: "updated" },
    { id: "kng", name: "KNG", type: "updated" },
  ]);
});
