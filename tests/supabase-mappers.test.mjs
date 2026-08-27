import assert from "node:assert/strict";
import test from "node:test";

let cityFromRow;
let cityToRow;
let profileFromRow;
try {
  ({ cityFromRow, cityToRow, profileFromRow } = await import("../src/lib/supabase/mappers.mjs"));
} catch {
  // RED: os mapeadores serão escritos após a falha deste contrato.
}

test("mapeia multiplicador numérico sem perder a ordem da cidade", () => {
  assert.deepEqual(
    cityFromRow({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Nobre",
      currency: "BRL",
      discount: "30",
      tebex_multiplier: "1.7",
      position: 2,
    }),
    {
      id: "11111111-1111-4111-8111-111111111111",
      nome: "Nobre",
      moeda: "BRL",
      desconto: 30,
      tebexMultiplier: 1.7,
    },
  );
});

test("multiplicador vazio permanece vazio e nunca vira zero", () => {
  assert.equal(
    cityFromRow({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Santa",
      currency: "BRL",
      discount: 30,
      tebex_multiplier: null,
      position: 0,
    }).tebexMultiplier,
    null,
  );
});

test("prepara a cidade na ordem recebida para gravação", () => {
  assert.deepEqual(
    cityToRow(
      {
        id: "33333333-3333-4333-8333-333333333333",
        nome: "KNG",
        moeda: "GBP",
        desconto: 20,
        tebexMultiplier: 1.7,
      },
      4,
    ),
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "KNG",
      currency: "GBP",
      discount: 20,
      tebexMultiplier: 1.7,
      position: 4,
    },
  );
});

test("descarta id textual legado para o Supabase gerar um UUID", () => {
  assert.equal(
    cityToRow(
      {
        id: "nobre",
        nome: "Nobre",
        moeda: "BRL",
        desconto: 30,
        tebexMultiplier: null,
      },
      0,
    ).id,
    null,
  );
});

test("perfil Supabase mantém o contrato público da interface", () => {
  assert.deepEqual(
    profileFromRow({
      id: "44444444-4444-4444-8444-444444444444",
      name: "Lucifer",
      email: "LUCIFER@GMAIL.COM",
      role: "owner",
      status: "approved",
      active: true,
    }),
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Lucifer",
      email: "lucifer@gmail.com",
      role: "owner",
      approved: true,
      status: "approved",
      active: true,
    },
  );
});
