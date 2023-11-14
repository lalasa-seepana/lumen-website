import type { Catalog, Challenge, Consultation, Receipt } from "@/lib/types";

export class ApiError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.detail?.code || "unavailable", body?.detail?.message || "Please try again in a moment.");
  }
  return response.json() as Promise<T>;
}

export const getLumenCatalog = () => publicRequest<Catalog>("/api/services");

export async function getFormChallenge() {
  const challenge = await publicRequest<Challenge>("/api/form-token");
  return { ...challenge, receivedAt: Date.now() };
}

export const challengeNeedsRefresh = (receivedAt: number) => Date.now() - receivedAt > 29 * 60 * 1000;

export async function waitForChallenge(receivedAt: number) {
  const delay = Math.max(0, 2200 - (Date.now() - receivedAt));
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
}

export const submitConsultation = (body: Consultation) => publicRequest<Receipt>("/api/consultations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
