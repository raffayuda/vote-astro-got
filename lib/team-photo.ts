import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_BYTES = 3 * 1024 * 1024; // 3MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const EXT_BY_NAME = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

function extFor(file: File): string | null {
  const byMime = EXT_BY_MIME[file.type];
  if (byMime) return byMime;
  const match = /\.([a-z0-9]+)$/i.exec(file.name ?? "");
  const ext = match ? `.${match[1].toLowerCase()}` : null;
  if (ext === ".jpeg") return ".jpg";
  return ext && EXT_BY_NAME.has(ext) ? ext : null;
}

/**
 * Simpan file foto tim ke public/uploads dan kembalikan path publiknya
 * (mis. "/uploads/123-abc.jpg"). Kembalikan null jika tidak ada file.
 * Melempar Error dengan pesan ramah jika file tidak valid.
 */
export async function saveTeamPhoto(file: unknown): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Ukuran foto maksimal 3MB.");
  const ext = extFor(file);
  if (!ext) throw new Error("Foto harus berekstensi jpg, png, webp, gif, atau svg.");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, filename), bytes);
  return `/uploads/${filename}`;
}

/** Hapus file foto lama. Hanya menghapus file di dalam /uploads/; URL luar diabaikan. */
export async function deleteTeamPhoto(photoUrl: string | null | undefined): Promise<void> {
  if (!photoUrl?.startsWith("/uploads/")) return;
  const filename = photoUrl.slice("/uploads/".length);
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) return;
  await unlink(join(UPLOAD_DIR, filename)).catch(() => {});
}
