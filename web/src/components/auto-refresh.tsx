"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-renderiza los server components de la ruta cada `seconds` segundos.
 *  Se usa en vistas en vivo para refrescar marcador/stats/probabilidades. */
export function AutoRefresh({ seconds = 45 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return null;
}
