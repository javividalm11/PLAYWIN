/**
 * Marca PickVerde: el trazo largo del check continúa como línea de gráfico
 * y termina en un nodo al alza. Hereda el color vía `currentColor`.
 */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <path
        d="M3 16.8 L11 24.8 L21 8.6 L24.6 13.8 L28.6 6.4"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28.6" cy="6.4" r="2.8" fill="currentColor" />
    </svg>
  );
}

/** Lockup horizontal: marca + palabra. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark className="h-7 w-7 text-brand-500" />
      <span className="text-xl font-extrabold tracking-[-.04em] text-silver-100">
        Pick<span className="text-brand-500">Verde</span>
      </span>
    </span>
  );
}
