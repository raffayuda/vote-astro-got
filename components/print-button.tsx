"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ children = "Cetak" }: { children?: React.ReactNode }) {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      {children}
    </Button>
  );
}
