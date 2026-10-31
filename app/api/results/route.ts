import { getResults } from "@/lib/results";
import { getSessionFor } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await getSessionFor("admin"))) return new Response("Unauthorized", { status: 401 });
  const stage = new URL(request.url).searchParams.get("stage") ?? undefined;
  return Response.json(await getResults(stage), { headers: { "Cache-Control": "no-store" } });
}
