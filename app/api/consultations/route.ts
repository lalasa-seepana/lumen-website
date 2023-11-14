import {
  assertHuman,
  assertOrigin,
  configuredSecret,
  EnquiryError,
  jsonError,
  parseEnquiry,
  readJson,
  verifyChallenge,
} from "@/lib/enquiry";
import { consumeSubmissionBudget, saveEnquiry } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    assertOrigin(request);
    const body = parseEnquiry(await readJson(request));
    assertHuman(body);
    const secret = configuredSecret();
    if (!secret) throw new EnquiryError(503, "form_unavailable", "The enquiry form is temporarily unavailable");
    const submissionId = verifyChallenge(body.form_token, secret);
    await consumeSubmissionBudget(request);
    const receipt = await saveEnquiry(body, submissionId);
    return Response.json(receipt, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EnquiryError) return jsonError(error);
    return jsonError(new EnquiryError(503, "form_unavailable", "The enquiry form is temporarily unavailable"));
  }
}
