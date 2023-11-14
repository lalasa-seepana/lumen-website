import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { assertHuman, assertOrigin, issueChallenge, parseEnquiry, payloadHash, readJson, verifyChallenge } from "./enquiry.ts";

const secret = "isolated-test-secret-32-characters-long";

function enquiry(overrides: Record<string, unknown> = {}) {
  return {
    full_name: "Asha Rao",
    email: "Asha@Example.com",
    phone: "",
    category: "Heal Your Mind",
    service_id: null,
    ai_call_consent: true,
    form_token: "x".repeat(80),
    website: "",
    ...overrides,
  };
}

test("enquiry validation keeps the stored fields and rejects extras", () => {
  const parsed = parseEnquiry(enquiry({ phone: " +91 98765 43210 " }));
  assert.equal(parsed.full_name, "Asha Rao");
  assert.equal(parsed.email, "asha@example.com");
  assert.equal(parsed.phone, "+91 98765 43210");
  assert.equal(parsed.service_id, null);
  assert.throws(() => parseEnquiry(enquiry({ tenant_id: "nope" })), /check your name/);
  assert.throws(() => parseEnquiry(enquiry({ phone: "123" })), /check your name/);
  assert.throws(() => parseEnquiry(enquiry({ email: "not-an-email" })), /check your name/);
  assert.equal(payloadHash(parsed), payloadHash({ ...parsed }));
});

test("form tokens expire, reject replays that are too fast, and reject tampering", () => {
  const now = 1_700_000_000_000;
  const challenge = issueChallenge(secret, now);
  assert.throws(() => verifyChallenge(challenge.token, secret, now + 1000), /refresh the form/);
  const id = verifyChallenge(challenge.token, secret, now + 5000);
  assert.match(id, /^[0-9a-f-]{36}$/);
  assert.throws(() => verifyChallenge(challenge.token, secret, now + 1900 * 1000), /refresh the form/);
  const tampered = `${challenge.token.slice(0, -1)}${challenge.token.endsWith("a") ? "b" : "a"}`;
  assert.throws(() => verifyChallenge(tampered, secret, now + 5000), /refresh the form/);
});

test("migration preserves the nine approved treatment prices", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261109200000_services_and_enquiries.sql", import.meta.url), "utf8");
  const expected = [
    ["Aroma Swedish Massage", "320000"],
    ["Deep Tissue Massage", "380000"],
    ["Balinese Massage", "460000"],
    ["Ayurvedic Abhyanga", "360000"],
    ["Shirodhara", "340000"],
    ["Hot Stone Therapy", "440000"],
    ["Coffee Body Polish", "280000"],
    ["Chocolate Body Wrap", "390000"],
    ["Vitamin C Facial", "340000"],
  ] as const;
  for (const [name, price] of expected) assert.match(sql, new RegExp(`${name}[\\s\\S]{0,180}${price}`));
  assert.doesNotMatch(sql, /create table[^;]*appointments|tenant_members|auth\.users/i);
});

test("request guards reject the wrong origin, content type, and oversized body", async () => {
  process.env.LUMEN_ALLOWED_ORIGINS = "http://localhost:3000";
  const untrusted = new Request("http://localhost:3000/api/consultations", { headers: { origin: "https://untrusted.example" } });
  assert.throws(() => assertOrigin(untrusted), /cannot submit enquiries/);
  const plain = new Request("http://localhost:3000/api/consultations", {
    method: "POST",
    headers: { "content-type": "text/plain", origin: "http://localhost:3000" },
    body: "hello",
  });
  await assert.rejects(readJson(plain), /JSON/);
  const huge = new Request("http://localhost:3000/api/consultations", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify({ padding: "x".repeat(5000) }),
  });
  await assert.rejects(readJson(huge), /too large/);
  const parsed = parseEnquiry(enquiry({ website: "https://spam.example" }));
  assert.throws(() => assertHuman(parsed), /refresh the form/);
});

test("browser files do not reference server credentials or local backend URLs", () => {
  const components = readdirSync(new URL("../components", import.meta.url)).filter((name) => name.endsWith(".tsx"));
  for (const file of [...components.map((name) => `../components/${name}`), "../lib/api.ts"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /SUPABASE|LUMEN_FORM_SECRET|from "postgres"|fastapi|127\.0\.0\.1:8000|NEXT_PUBLIC_API|gxyqichulmpaqlskodwp|Jubilee|Hyderabad|hyderabad/);
  }
  const example = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  assert.doesNotMatch(example, /gxyqichulmpaqlskodwp/);
  assert.match(example, /SUPABASE_DB_URL/);
  assert.match(example, /LUMEN_FORM_SECRET/);
  assert.match(example, /pooler\.supabase\.com:6543/);
  assert.doesNotMatch(example, /pooler\.supabase\.com:5432/);
});
