import { LumenWebsite } from "@/components/lumen-website";
import { loadCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const catalog = await loadCatalog();
  return <LumenWebsite initialCatalog={catalog} />;
}
