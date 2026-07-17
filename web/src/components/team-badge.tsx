"use client";

import Image from "next/image";
import { useState } from "react";
import type { Team } from "@/lib/types";

/** Escudo del equipo con fallback a iniciales si la imagen no existe (404). */
export function TeamBadge({ team, size = 28 }: { team: Team; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (team.crest && !failed) {
    return (
      <Image
        src={team.crest}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-pitch-600 font-mono font-bold text-silver-300"
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.3) }}
      aria-hidden
    >
      {(team.shortName ?? team.name).slice(0, 3).toUpperCase()}
    </span>
  );
}
