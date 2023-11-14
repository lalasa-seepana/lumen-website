import postgres from "postgres";
import { clientAddress, configuredSecret, consentRecord, EnquiryError, fingerprint, payloadHash } from "./enquiry.ts";
import type { Catalog, Category, Consultation, Receipt, Service } from "./types.ts";
import { PUBLIC_PHONE } from "./types.ts";

type Sql = postgres.Sql;

let sql: Sql | null = null;
let sqlUrl = "";

export function databaseUrl(): string | null {
  const value = process.env.SUPABASE_DB_URL?.trim() ?? "";
  if (!value || value.includes("PASTE_") || value.includes("YOUR_PROJECT") || value.includes("YOUR_DATABASE") || value.includes("YOUR-PASSWORD")) {
    return null;
  }
  // Next.js connections are short-lived. Shared-pooler session mode (port 5432)
  // holds a backend connection for the whole client session; transaction mode
  // (6543) returns it after each transaction. prepare: false is required there.
  return value.includes("pooler.supabase.com:5432")
    ? value.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543")
    : value;
}

function getSql(): Sql | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!sql || sqlUrl !== url) {
    const local = url.includes("localhost") || url.includes("127.0.0.1");
    sql = postgres(url, {
      ssl: local ? false : "require",
      max: 1,
      connect_timeout: 10,
      idle_timeout: 20,
      max_lifetime: 60 * 5,
      prepare: false,
      connection: { application_name: "lumen-website" },
    });
    sqlUrl = url;
  }
  return sql;
}

function unavailable(): EnquiryError {
  return new EnquiryError(503, "form_unavailable", "The enquiry form is temporarily unavailable");
}

async function limit(tx: postgres.TransactionSql, key: string, maximum: number, seconds: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const window = new Date((now - (now % seconds)) * 1000);
  const rows = await tx<{ attempts: number }[]>`
    insert into public.consultation_rate_limits (bucket, window_start, attempts)
    values (${key}, ${window}, 1)
    on conflict (bucket, window_start)
    do update set attempts = consultation_rate_limits.attempts + 1
    returning attempts
  `;
  const attempts = rows[0]?.attempts ?? maximum + 1;
  if (attempts > maximum) {
    throw new EnquiryError(429, "rate_limited", "Too many requests. Please try again later");
  }
}

export async function loadCatalog(): Promise<Catalog | null> {
  const db = getSql();
  if (!db) return null;
  try {
    const rows = await db<{ id: string; name: string; category: Category; price_paise: number }[]>`
      select id, name, category, price_paise
      from public.services
      where active
        and price_paise is not null
        and category in ('Heal Your Mind', 'Heal Your Body', 'Skin & Body Rituals')
      order by display_order, name
    `;
    const services: Service[] = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      category: row.category,
      price_paise: Number(row.price_paise),
    }));
    return { phone: PUBLIC_PHONE, services };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown catalog error";
    console.error("lumen catalog query failed", message);
    return null;
  }
}

export async function consumeSubmissionBudget(request: Request): Promise<void> {
  const secret = configuredSecret();
  const db = getSql();
  if (!secret || !db) throw unavailable();
  const address = clientAddress(request);
  await db.begin(async (tx) => {
    await tx`delete from public.consultation_rate_limits where window_start < now() - interval '1 day'`;
    await limit(tx, fingerprint(secret, `ip:${address}`), 5, 600);
    await limit(tx, fingerprint(secret, "global-submissions"), 60, 3600);
  });
}

export async function saveEnquiry(body: Consultation, submissionId: string): Promise<Receipt> {
  const secret = configuredSecret();
  const db = getSql();
  if (!secret || !db) throw unavailable();
  const digest = payloadHash(body);
  const consent = consentRecord();
  try {
    const row = await db.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtextextended(${submissionId}, 0::bigint))`;
      const existing = await tx<{ id: string; created_at: Date; payload_hash: string }[]>`
        select id, created_at, payload_hash
        from public.consultation_enquiries
        where submission_id = ${submissionId}::uuid
      `;
      const prior = existing[0];
      if (prior) {
        if (prior.payload_hash !== digest) {
          throw new EnquiryError(409, "submission_conflict", "This form was already submitted. Please start a new enquiry");
        }
        return prior;
      }
      const services = await tx<{ id: string }[]>`
        select id from public.services
        where category = ${body.category} and active and price_paise is not null
      `;
      const ids = new Set(services.map((service) => String(service.id)));
      if (ids.size === 0 || (body.service_id && !ids.has(body.service_id))) {
        throw new EnquiryError(422, "service_unavailable", "Please choose an available service in this category");
      }
      await limit(tx, fingerprint(secret, `email:${body.email}`), 3, 3600);
      const inserted = await tx<{ id: string; created_at: Date }[]>`
        insert into public.consultation_enquiries (
          service_id, category, full_name, email, phone, ai_call_consent,
          consent_text, consent_version, submission_id, payload_hash
        ) values (
          ${body.service_id}::uuid, ${body.category}, ${body.full_name}, ${body.email}, ${body.phone},
          ${body.ai_call_consent}, ${consent.consent_text}, ${consent.consent_version},
          ${submissionId}::uuid, ${digest}
        )
        returning id, created_at
      `;
      const saved = inserted[0];
      if (!saved) throw unavailable();
      return saved;
    });
    const created = row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();
    return { id: String(row.id), status: "enquiry_received", created_at: created };
  } catch (error) {
    if (error instanceof EnquiryError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (message.includes("service_unavailable")) {
      throw new EnquiryError(422, "service_unavailable", "Please choose an available service in this category");
    }
    throw unavailable();
  }
}
