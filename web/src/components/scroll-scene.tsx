"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

const SCENE_VIDEO = "/brand/section.mp4";

/** Suavizado exponencial del scrubbing; sin esto el vídeo salta entre frames. */
const LERP_TAU = 8;
const SNAP = 0.002;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Rampa de entrada y salida: una sección se va antes de que llegue la siguiente. */
function fade(p: number, inAt: number, holdUntil: number, last = false) {
  if (p < inAt) return 0;
  if (p < inAt + 0.08) return (p - inAt) / 0.08;
  if (last || p < holdUntil) return 1;
  return Math.max(0, 1 - (p - holdUntil) / 0.08);
}

function Item({ delay, children, className = "" }: { delay: number; children: ReactNode; className?: string }) {
  return (
    <div className={`scene-item ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/**
 * Escena de 500vh: el vídeo no se reproduce, su posición la manda el scroll.
 * Encima, tres bloques de texto que se relevan secuencialmente.
 *
 * Las opacidades se escriben en el DOM desde el rAF en vez de pasar por estado
 * de React: si no, serían 60 re-renders por segundo mientras se hace scroll.
 */
export function ScrollScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const sections = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const el = wrap.current;
    const v = video.current;
    if (!el || !v) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let current = 0;

    // iOS no permite buscar en un vídeo que nunca se ha decodificado: lo
    // arrancamos en silencio y lo paramos al instante para dejarlo listo.
    v.play().then(() => v.pause()).catch(() => {});

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      const span = el.offsetHeight - window.innerHeight;
      const p = span > 0 ? clamp((window.scrollY - el.offsetTop) / span, 0, 1) : 0;

      const opacities = [
        p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.08),
        fade(p, 0.32, 0.55),
        fade(p, 0.67, 1, true),
      ];

      for (let i = 0; i < opacities.length; i++) {
        const node = sections.current[i];
        if (!node) continue;
        const o = opacities[i];
        node.style.opacity = String(o);
        node.style.pointerEvents = o > 0.5 ? "auto" : "none";
        const show = o > 0.3;
        if (node.dataset.show !== String(show)) {
          node.dataset.show = String(show);
          node.setAttribute("aria-hidden", String(!show));
        }
      }

      const dur = v.duration;
      if (dur > 0 && Number.isFinite(dur)) {
        const target = p * dur;
        if (reduced) {
          current = target;
        } else {
          current += (target - current) * (1 - Math.exp(-dt * LERP_TAU));
          if (Math.abs(target - current) < SNAP) current = target;
        }
        if (v.readyState >= 2 && !v.seeking && Math.abs(v.currentTime - current) > 0.01) {
          v.currentTime = current;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sectionBase = "absolute inset-0 transition-opacity duration-100 ease-out";

  return (
    <div ref={wrap} className="relative h-[500vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-pitch-950">
        <video
          ref={video}
          className="absolute inset-0 h-full w-full object-cover"
          src={SCENE_VIDEO}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-pitch-950/45" aria-hidden="true" />

        <div className="absolute inset-0">
          {/* 1 — izquierda */}
          <section
            ref={n => { sections.current[0] = n; }}
            data-show="true"
            className={`${sectionBase} flex flex-col justify-center px-6 sm:px-8 md:px-20 lg:px-32`}
          >
            <Item delay={0}>
              <h2 className="max-w-4xl text-[clamp(2rem,5vw,5rem)] font-light uppercase leading-[1.2] text-white">
                Registrado antes del pitido inicial
              </h2>
            </Item>
            <Item delay={150}>
              <p className="mt-6 text-sm uppercase tracking-[0.3em] text-white/90">
                Ningún pick se edita después
              </p>
            </Item>
          </section>

          {/* 2 — centro */}
          <section
            ref={n => { sections.current[1] = n; }}
            data-show="false"
            className={`${sectionBase} flex items-center justify-center px-6 opacity-0 sm:px-8`}
          >
            <Item delay={0} className="max-w-[900px]">
              <h2 className="text-center text-[clamp(1.5rem,4.5vw,4.5rem)] font-extralight uppercase leading-[1.3] tracking-wide text-white">
                Construimos ventaja con datos{" "}
                <span className="text-white/80">y precisión</span>{" "}
                <span className="text-white/50">en cada partido</span>
              </h2>
            </Item>
          </section>

          {/* 3 — derecha */}
          <section
            ref={n => { sections.current[2] = n; }}
            data-show="false"
            className={`${sectionBase} flex items-center justify-end px-6 opacity-0 sm:px-8 md:px-20 lg:px-32`}
          >
            <div className="max-w-2xl text-left">
              <Item delay={0}>
                <p className="mb-4 text-lg tracking-wide text-white/60">Track record público</p>
              </Item>
              <Item delay={150}>
                <h2 className="mb-8 text-[clamp(2rem,4vw,4rem)] font-light uppercase leading-[1.2] tracking-wide text-white">
                  Los números no discuten.
                  <br />
                  Solo cuentan.
                </h2>
              </Item>
              <Item delay={300}>
                <Link href="/resultados" className="group inline-flex items-center gap-4">
                  <span className="text-sm uppercase tracking-[0.3em] text-white/80">Ver resultados</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition-transform duration-300 group-hover:scale-110">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-pitch-950" aria-hidden>
                      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </Item>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
