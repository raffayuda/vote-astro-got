"use client";

import { useMemo, useState } from "react";
import { deleteCode, reopenQr, updateQrQuota } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export type QrItem = {
  id: number;
  tableName: string | null;
  label: string | null;
  maxUses: number;
  usedCount: number;
};

export function QrTable({ qrs }: { qrs: QrItem[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "full">("all");

  const filteredQrs = useMemo(() => {
    return qrs.filter((qr) => {
      const isFull = qr.usedCount >= qr.maxUses;
      if (filter === "available" && isFull) return false;
      if (filter === "full" && !isFull) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const label = (qr.label ?? "").toLowerCase();
      const table = (qr.tableName ?? "").toLowerCase();
      const idStr = String(qr.id);
      return label.includes(q) || table.includes(q) || idStr.includes(q);
    });
  }, [qrs, search, filter]);

  const availableCount = qrs.filter((q) => q.usedCount < q.maxUses).length;
  const fullCount = qrs.filter((q) => q.usedCount >= q.maxUses).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/60 bg-surface-2 p-3">
        <div className="flex flex-1 min-w-[200px] max-w-sm items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor/label QR..."
            className="h-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-astro-blue text-white shadow-2xs"
                : "bg-white text-astro-navy/70 hover:bg-surface-3 hover:text-astro-navy"
            }`}
          >
            Semua ({qrs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("available")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              filter === "available"
                ? "bg-ok text-white shadow-2xs"
                : "bg-white text-ok hover:bg-ok/10"
            }`}
          >
            Belum Penuh ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("full")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              filter === "full"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-white text-amber-600 hover:bg-amber-50"
            }`}
          >
            Penuh ({fullCount})
          </button>
        </div>
      </div>

      {/* Tabel Kompak dengan Scroll Container */}
      <div className="overflow-hidden rounded-2xl border border-line/60 bg-white shadow-soft">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-line/60 bg-surface-2 text-2xs font-extrabold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2.5">Label QR</th>
                <th className="px-4 py-2.5 text-center">Status Suara</th>
                <th className="px-4 py-2.5 text-center">Set Kuota</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filteredQrs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted">
                    {search ? "Tidak ada QR yang cocok dengan pencarian." : "Belum ada QR code."}
                  </td>
                </tr>
              ) : (
                filteredQrs.map((qr) => {
                  const isFull = qr.usedCount >= qr.maxUses;
                  const displayName = qr.label
                    ? qr.tableName
                      ? `${qr.tableName} · ${qr.label}`
                      : qr.label
                    : `QR #${qr.id}`;

                  return (
                    <tr
                      key={qr.id}
                      className="hover:bg-surface-1/70 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-bold text-astro-navy whitespace-nowrap">
                        {displayName}
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <Badge tone={isFull ? "accent" : "success"} className="text-2xs font-bold">
                          {qr.usedCount}/{qr.maxUses} suara
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <ActionForm action={updateQrQuota} className="inline-flex items-center gap-1">
                          <input type="hidden" name="id" value={qr.id} />
                          <input
                            name="maxUses"
                            type="number"
                            min={1}
                            max={1000}
                            defaultValue={qr.maxUses}
                            aria-label={`Kuota ${displayName}`}
                            className="h-7 w-14 rounded-lg border border-line/70 px-1.5 text-center text-xs font-semibold focus:border-astro-blue focus:outline-none"
                          />
                          <SubmitButton variant="secondary" size="sm" className="h-7 px-2 text-2xs" pendingText="...">
                            Set
                          </SubmitButton>
                        </ActionForm>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <ActionForm action={reopenQr}>
                            <input type="hidden" name="id" value={qr.id} />
                            <SubmitButton variant="secondary" size="sm" className="h-7 px-2 text-2xs" pendingText="...">
                              +1 Slot
                            </SubmitButton>
                          </ActionForm>
                          <ButtonLink
                            href={`/admin/qr/cetak?qr=${qr.id}`}
                            variant="secondary"
                            size="sm"
                            prefetch={false}
                            className="h-7 px-2.5 text-2xs"
                          >
                            Cetak
                          </ButtonLink>
                          <ActionForm action={deleteCode}>
                            <input type="hidden" name="id" value={qr.id} />
                            <SubmitButton
                              variant="danger"
                              size="sm"
                              className="h-7 px-2 text-2xs"
                              pendingText="..."
                            >
                              Hapus
                            </SubmitButton>
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line/60 bg-surface-2 px-4 py-2 text-2xs text-muted flex items-center justify-between">
          <span>Menampilkan {filteredQrs.length} dari {qrs.length} QR code</span>
          <span className="font-semibold text-astro-navy">9 QR per halaman cetak A4</span>
        </div>
      </div>
    </div>
  );
}

