export function LiveBadge({ minute }: { minute?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-400">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-live-pulse" />
      En vivo{typeof minute === "number" ? ` · ${minute}'` : ""}
    </span>
  );
}
