import { redirect } from "next/navigation";

export default async function AdminTimLegacyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { id } = await params;
  const { stage } = await searchParams;
  const query = stage ? `?stage=${encodeURIComponent(stage)}` : "";
  redirect(`/admin/penampilan/${id}${query}`);
}

