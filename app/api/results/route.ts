import { getResults } from "@/lib/results";
import { getSessionFor } from "@/lib/session";

export async function GET() {
  if (!(await getSessionFor("admin"))) return new Response("Unauthorized", { status: 401 });
  return Response.json(await getResults(), { headers: { "Cache-Control": "no-store" } });
}
