"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Entrada escalonada: opacidad 0→1 y translateY(24px)→0 en 0.8s.
 * Se dispara al entrar en viewport y se desactiva sola (una sola vez).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // "Sin movimiento" se resuelve en CSS (.reveal), no aquí: así el contenido
    // siempre es visible sin depender de que el observer llegue a disparar.
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.8s ${EASE} ${delay}ms, transform 0.8s ${EASE} ${delay}ms`,
        willChange: shown ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
