import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("a migração concede às Edge Functions acesso administrativo explícito", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/202608250003_service_role_grants.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /grant all on table public\.profiles/i);
  assert.match(sql, /public\.cities/i);
  assert.match(sql, /public\.exchange_rates/i);
  assert.match(sql, /public\.audit_logs/i);
  assert.match(sql, /to service_role/i);
});
