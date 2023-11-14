import assert from "node:assert/strict";
import { after, test } from "node:test";
import { databaseUrl } from "./store.ts";

const previous = process.env.SUPABASE_DB_URL;

after(() => {
  if (previous === undefined) delete process.env.SUPABASE_DB_URL;
  else process.env.SUPABASE_DB_URL = previous;
});

test("databaseUrl uses the transaction pooler for Next.js traffic", () => {
  process.env.SUPABASE_DB_URL = "postgresql://postgres.ref:pass@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres";
  assert.equal(databaseUrl(), "postgresql://postgres.ref:pass@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres");
  process.env.SUPABASE_DB_URL = "postgresql://postgres.ref:pass@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require";
  assert.equal(databaseUrl(), "postgresql://postgres.ref:pass@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require");
  process.env.SUPABASE_DB_URL = "postgresql://postgres:pass@127.0.0.1:5432/postgres";
  assert.equal(databaseUrl(), "postgresql://postgres:pass@127.0.0.1:5432/postgres");
});
