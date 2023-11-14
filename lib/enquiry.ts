import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { CATEGORIES, CONSENT_TEXT, CONSENT_VERSION, type Category, type Consultation } from "./types.ts";

export class EnquiryError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const EMAIL_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^\+?[0-9][0-9 ().-]{6,19}$/;

export function configuredSecret(): string | null {
  const value = process.env.LUMEN_FORM_SECRET?.trim() ?? "";
  if (value.length < 32 || value.includes("PASTE_")) return null;
  return value;
}

export function allowedOrigins(): string[] {
  const raw = process.env.LUMEN_ALLOWED_ORIGINS?.trim() || "http://localhost:3000";
  const origins = raw.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
  if (origins.includes("*")) {
    throw new EnquiryError(503, "form_unavailable", "The enquiry form is temporarily unavailable");
  }
  return origins;
}

export function assertOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins().includes(origin)) {
    throw new EnquiryError(403, "origin_not_allowed", "This website cannot submit enquiries");
  }
}

export function clientAddress(request: Request): string {
  const headerName = process.env.LUMEN_TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (!headerName) return "direct";
  const value = request.headers.get(headerName)?.split(",")[0]?.trim();
  return value || "direct";
}

export function fingerprint(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function issueChallenge(secret: string, nowMs = Date.now()): { token: string; expires_in: number } {
  const issued = Math.floor(nowMs / 1000);
  const payload = `${randomUUID()}.${issued}`;
  const signature = fingerprint(secret, payload);
  return { token: `${payload}.${signature}`, expires_in: 1800 };
}

export function verifyChallenge(token: string, secret: string, nowMs = Date.now()): string {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("shape");
    const submissionId = parts[0] ?? "";
    const issuedText = parts[1] ?? "";
    const signature = parts[2] ?? "";
    if (!UUID_PATTERN.test(submissionId) || !/^[0-9]+$/.test(issuedText) || !/^[0-9a-f]{64}$/.test(signature)) {
      throw new Error("shape");
    }
    const expected = fingerprint(secret, `${submissionId}.${issuedText}`);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      throw new Error("signature");
    }
    const age = nowMs / 1000 - Number(issuedText);
    if (age < 2 || age > 1800) throw new Error("age");
    return submissionId;
  } catch (error) {
    if (error instanceof EnquiryError) throw error;
    throw new EnquiryError(422, "form_expired", "Please refresh the form and try again");
  }
}

function cleanName(value: string): string {
  if ([...value].some((char) => /\p{C}/u.test(char))) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  const name = value.split(/\s+/).filter(Boolean).join(" ");
  if (name.length < 2 || name.length > 120 || ![...name].some((char) => /\p{L}/u.test(char))) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  return name;
}

function cleanEmail(value: string): string {
  if (!EMAIL_PATTERN.test(value)) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  const at = value.lastIndexOf("@");
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..") || domain.split(".").some((part) => part.length > 63)) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  return value.toLowerCase();
}

function cleanPhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (phone.length < 7 || phone.length > 20 || digits.length < 7 || !PHONE_PATTERN.test(phone)) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  return phone;
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.some((item) => item === value);
}

const ALLOWED_KEYS = new Set(["full_name", "email", "phone", "category", "service_id", "ai_call_consent", "form_token", "website"]);

export function parseEnquiry(input: unknown): Consultation {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => !ALLOWED_KEYS.has(key))) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  if (typeof record.full_name !== "string" || typeof record.email !== "string" || typeof record.form_token !== "string") {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  const category = record.category;
  if (typeof record.ai_call_consent !== "boolean" || !isCategory(category)) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  const serviceId = record.service_id;
  if (serviceId !== null && serviceId !== undefined && (typeof serviceId !== "string" || !UUID_PATTERN.test(serviceId))) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  const phoneValue = record.phone === undefined || record.phone === null ? "" : record.phone;
  const website = record.website === undefined ? "" : record.website;
  if (typeof phoneValue !== "string" || typeof website !== "string" || website.length > 200 || record.form_token.length < 80 || record.form_token.length > 180) {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
  return {
    full_name: cleanName(record.full_name.trim()),
    email: cleanEmail(record.email.trim()),
    phone: cleanPhone(phoneValue),
    category,
    service_id: serviceId ? serviceId.toLowerCase() : null,
    ai_call_consent: record.ai_call_consent,
    form_token: record.form_token,
    website,
  };
}

export function assertHuman(body: Consultation): void {
  if (body.website.trim()) {
    throw new EnquiryError(422, "invalid_enquiry", "Please refresh the form and try again");
  }
}

export function payloadHash(body: Consultation): string {
  const fields = {
    ai_call_consent: body.ai_call_consent,
    category: body.category,
    email: body.email,
    full_name: body.full_name,
    phone: body.phone,
    service_id: body.service_id,
  };
  return createHash("sha256").update(JSON.stringify(fields)).digest("hex");
}

export function consentRecord(): { consent_text: string; consent_version: string } {
  return { consent_text: CONSENT_TEXT, consent_version: CONSENT_VERSION };
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim();
  if (contentType !== "application/json") {
    throw new EnquiryError(415, "invalid_content_type", "Please submit the enquiry form as JSON");
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > 4096) {
    throw new EnquiryError(413, "request_too_large", "The enquiry is too large");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > 4096) throw new EnquiryError(413, "request_too_large", "The enquiry is too large");
    chunks.push(value);
  }
  const encoded = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    encoded.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(encoded));
  } catch {
    throw new EnquiryError(422, "invalid_enquiry", "Please check your name, email, phone, service choice and consent selection");
  }
}

export function jsonError(error: EnquiryError): Response {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (error.status === 429) headers.set("Retry-After", "3600");
  return Response.json({ detail: { code: error.code, message: error.message } }, { status: error.status, headers });
}
