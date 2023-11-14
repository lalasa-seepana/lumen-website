import { EnquiryError, jsonError } from "@/lib/enquiry";
import { loadCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const catalog = await loadCatalog();
    if (!catalog?.services.length) {
      throw new EnquiryError(503, "clinic_unconfigured", "The service menu is temporarily unavailable");
    }
    return Response.json(catalog, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof EnquiryError) return jsonError(error);
    return jsonError(new EnquiryError(503, "clinic_unconfigured", "The service menu is temporarily unavailable"));
  }
}
