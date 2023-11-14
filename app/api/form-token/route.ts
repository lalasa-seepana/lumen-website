import { allowedOrigins, assertOrigin, configuredSecret, EnquiryError, issueChallenge, jsonError } from "@/lib/enquiry";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    assertOrigin(request);
    allowedOrigins();
    const secret = configuredSecret();
    if (!secret) throw new EnquiryError(503, "form_unavailable", "The enquiry form is temporarily unavailable");
    return Response.json(issueChallenge(secret), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EnquiryError) return jsonError(error);
    return jsonError(new EnquiryError(503, "form_unavailable", "The enquiry form is temporarily unavailable"));
  }
}
