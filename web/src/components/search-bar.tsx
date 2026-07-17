"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({
  size = "lg",
  placeholder = "Busca un equipo, jugador o partido…",
}: {
  size?: "lg" | "md";
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    router.push(`/buscar?q=${encodeURIComponent(query)}`);
  }

  const isLg = size === "lg";

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <div
        className={`group flex items-center gap-3 rounded-2xl border border-pitch-600 bg-pitch-800/80 backdrop-blur transition-all focus-within:border-brand-500/60 focus-within:glow-brand ${
          isLg ? "px-5 py-4" : "px-4 py-2.5"
        }`}
      >
        <svg
          className={`shrink-0 text-silver-500 group-focus-within:text-brand-400 ${isLg ? "h-5 w-5" : "h-4 w-4"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent text-silver-100 outline-none placeholder:text-silver-600 ${
            isLg ? "text-base" : "text-sm"
          }`}
          aria-label="Buscar equipo, jugador o partido"
        />
        <button
          type="submit"
          className={`shrink-0 rounded-xl bg-brand-500 font-semibold text-pitch-950 transition-colors hover:bg-brand-400 ${
            isLg ? "px-5 py-2 text-sm" : "px-3.5 py-1.5 text-xs"
          }`}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
