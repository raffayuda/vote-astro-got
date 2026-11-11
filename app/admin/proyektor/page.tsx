import { ProjectorScreen } from "@/components/projector-screen";
import { requireRole } from "@/lib/session";
import { getTransparencyData } from "@/lib/transparency";

export const metadata = { title: "Transparansi Penilaian — ASTRO Got Talent" };

export default async function ProjectorPage() {
  await requireRole("admin");
  const data = await getTransparencyData();

  return <ProjectorScreen initial={data} />;
}
