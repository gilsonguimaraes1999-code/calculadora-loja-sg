import assert from "node:assert/strict";
import test from "node:test";

let createDataCache;
try {
  ({ createDataCache } = await import("../src/lib/cache/data-cache.mjs"));
} catch {
  // RED: o cache será criado depois deste contrato falhar.
}

function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

test("reutiliza dados persistidos enquanto estiverem válidos", async () => {
  let now = 1000;
  let calls = 0;
  const cache = createDataCache({ storage: storage(), now: () => now });
  const first = await cache.load("cities", 5000, async () => ({ count: ++calls }));
  now = 2000;
  const second = await cache.load("cities", 5000, async () => ({ count: ++calls }));
  assert.deepEqual(first, { count: 1 });
  assert.deepEqual(second, { count: 1 });
  assert.equal(calls, 1);
});

test("recarrega dados expirados e permite atualização forçada", async () => {
  let now = 1000;
  let calls = 0;
  const cache = createDataCache({ storage: storage(), now: () => now });
  await cache.load("rates", 100, async () => ++calls);
  await cache.load("rates", 100, async () => ++calls, { fresh: true });
  now = 1300;
  const value = await cache.load("rates", 100, async () => ++calls);
  assert.equal(value, 3);
});

test("remove uma categoria depois de uma alteração", async () => {
  let calls = 0;
  const cache = createDataCache({ storage: storage(), now: () => 1000 });
  await cache.load("users", 5000, async () => ++calls);
  cache.remove("users");
  await cache.load("users", 5000, async () => ++calls);
  assert.equal(calls, 2);
});
