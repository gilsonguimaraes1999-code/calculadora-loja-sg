import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("a RPC de cidades usa exclusão explícita compatível com proteção contra delete total", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/202608250004_safe_save_cities.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /delete from public\.cities\s+where id is not null/i);
  assert.doesNotMatch(sql, /delete from public\.cities\s*;/i);
});
