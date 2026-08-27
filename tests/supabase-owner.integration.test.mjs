import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.SUPABASE_OWNER_EMAIL;
const password = process.env.SUPABASE_OWNER_PASSWORD;

test(
  "conta migrada é owner aprovada e lê as tabelas protegidas",
  {
    skip: !url || !key || !email || !password,
  },
  async () => {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { error: loginError } = await client.auth.signInWithPassword({ email, password });
    assert.equal(loginError, null);

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("email,role,status,active")
      .eq("email", email)
      .single();
    assert.equal(profileError, null);
    assert.deepEqual(profile, {
      email: "lucifer@gmail.com",
      role: "owner",
      status: "approved",
      active: true,
    });

    const { error: citiesError } = await client.from("cities").select("id").limit(1);
    assert.equal(citiesError, null);
    await client.auth.signOut();
  },
);
