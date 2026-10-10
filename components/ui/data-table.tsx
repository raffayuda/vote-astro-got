import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "Belum ada data.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-line/60 bg-white text-ink shadow-soft">
      <table className="w-full text-left text-sm">
        <thead className="bg-sky-bottom text-xs uppercase tracking-wide text-astro-navy/70">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={cn("px-4 py-3 font-bold", c.align === "right" && "text-right")}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/30">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-sky-bottom/60">
              {columns.map((c) => (
                <td key={c.header} className={cn("px-4 py-3", c.align === "right" && "text-right tabular-nums")}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
