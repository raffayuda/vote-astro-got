import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { del, put } from "@vercel/blob";

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

/** Ada token Blob (production/Vercel) → pakai penyimpanan Blob, bukan filesystem lokal. */
function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Simpan foto tim dan kembalikan URL publiknya.
 * - Production (ada BLOB_READ_WRITE_TOKEN): upload ke Vercel Blob → URL https://...
 * - Lokal (tanpa token): tulis ke public/uploads → path "/uploads/...."
 * Kembalikan null jika tidak ada file. Melempar Error dengan pesan ramah jika file tidak valid.
 */
export async function saveTeamPhoto(file: unknown): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Ukuran foto maksimal 3MB.");
  const ext = extFor(file);
  if (!ext) throw new Error("Foto harus berekstensi jpg, png, webp, gif, atau svg.");

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

  if (hasBlobToken()) {
    try {
      const blob = await put(`team/${filename}`, file, {
        access: "public",
        contentType: file.type || undefined,
      });
      return blob.url;
    } catch (e) {
      // Sertakan pesan asli dari Vercel Blob (tidak mengandung token/rahasia)
      // agar penyebabnya terlihat di UI admin & Runtime Logs, mis:
      // "Access denied", "Store not found", "Incorrect token".
      const detail = e instanceof Error ? e.message : String(e);
      console.error("[team-photo] Blob upload gagal:", detail);
      throw new Error(`Gagal mengupload foto: ${detail}`);
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, filename), bytes);
  return `/uploads/${filename}`;
}

/** Hapus foto lama. Mendukung URL Vercel Blob (https://...) dan path lokal (/uploads/...). */
export async function deleteTeamPhoto(photoUrl: string | null | undefined): Promise<void> {
  if (!photoUrl) return;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    if (hasBlobToken()) await del(photoUrl).catch(() => {});
    return;
  }
  if (!photoUrl.startsWith("/uploads/")) return;
  const filename = photoUrl.slice("/uploads/".length);
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) return;
  await unlink(join(UPLOAD_DIR, filename)).catch(() => {});
}
