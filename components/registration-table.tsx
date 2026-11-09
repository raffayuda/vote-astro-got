"use client";

import { useMemo, useState } from "react";
import { deleteRegistration } from "@/app/actions/registration";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export type RegistrationItem = {
  id: number;
  name: string;
  nim: string;
  createdAt: string; // ISO string
};

export function RegistrationTable({ items }: { items: RegistrationItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.nim.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/60 bg-surface-2 p-3">
        <div className="flex flex-1 min-w-[220px] max-w-sm items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan Nama atau NIM..."
            className="h-9 text-xs"
          />
        </div>
        <div className="text-xs font-semibold text-muted">
          Ditemukan: <strong className="text-astro-navy">{filtered.length}</strong> dari {items.length} pendaftar
        </div>
      </div>

      {/* Tabel Kompak */}
      <div className="overflow-hidden rounded-2xl border border-line/60 bg-white shadow-soft">
        <div className="max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-line/60 bg-surface-2 text-2xs font-extrabold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2.5 w-12 text-center">No</th>
                <th className="px-4 py-2.5">Waktu Daftar</th>
                <th className="px-4 py-2.5">Nama Lengkap</th>
                <th className="px-4 py-2.5">NIM</th>
                <th className="px-4 py-2.5 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">
                    {search ? "Tidak ada pendaftar yang cocok dengan pencarian." : "Belum ada data pendaftar."}
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const dateStr = new Date(item.createdAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-1/70 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-center font-bold text-muted tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 text-muted font-medium whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-astro-navy">
                        {item.name}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-astro-blue">
                        {item.nim}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <ActionForm action={deleteRegistration}>
                          <input type="hidden" name="id" value={item.id} />
                          <SubmitButton
                            variant="danger"
                            size="sm"
                            className="h-7 px-2 text-2xs"
                            pendingText="..."
                            title="Hapus pendaftar ini"
                          >
                            Hapus
                          </SubmitButton>
                        </ActionForm>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line/60 bg-surface-2 px-4 py-2 text-2xs text-muted flex items-center justify-between">
          <span>Menampilkan {filtered.length} pendaftar</span>
          <span className="font-semibold text-astro-navy">Pendaftaran ASTRO Got Talent</span>
        </div>
      </div>
    </div>
  );
}

