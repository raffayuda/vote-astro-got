"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Muat ulang data server component secara berkala (mis. status buka/tutup sesi). */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
