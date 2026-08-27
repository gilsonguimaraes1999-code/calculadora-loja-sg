import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

test(
  "projeto hospedado bloqueia todas as tabelas comerciais para anônimos",
  { skip: !url || !key },
  async () => {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const checks = await Promise.all([
      client.from("profiles").select("id").limit(1),
      client.from("cities").select("id").limit(1),
      client.from("exchange_rates").select("pair").limit(1),
      client.from("audit_logs").select("id").limit(1),
    ]);

    for (const check of checks) assert.equal(check.error?.code, "42501");
  },
);
