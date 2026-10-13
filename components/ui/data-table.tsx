import { Fragment, type ReactNode } from "react";
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
  onRowClick,
  expandedKey,
  renderExpanded,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: string;
  onRowClick?: (row: T) => void;
  expandedKey?: string | number | null;
  renderExpanded?: (row: T) => ReactNode;
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
          {rows.map((row) => {
            const expanded = renderExpanded && expandedKey !== undefined && rowKey(row) === expandedKey;
            return (
              <Fragment key={rowKey(row)}>
                <tr
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("hover:bg-sky-bottom/60", onRowClick && "cursor-pointer", expanded && "bg-sky-bottom/60")}
                >
                  {columns.map((c) => (
                    <td key={c.header} className={cn("px-4 py-3", c.align === "right" && "text-right tabular-nums")}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
                {renderExpanded && (
                  <tr aria-hidden={!expanded}>
                    <td colSpan={columns.length} className="bg-sky-bottom/40 p-0">
                      {/* Animasi buka/tutup smooth: baris selalu di-mount, tinggi dianimasikan via grid-rows. */}
                      <div
                        className={cn(
                          "grid transition-all duration-300 ease-in-out",
                          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="px-4 py-4">{renderExpanded(row)}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
