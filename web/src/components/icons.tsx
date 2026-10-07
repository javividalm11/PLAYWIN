export type SportName =
  | "football"
  | "basketball"
  | "tennis"
  | "hockey"
  | "esports"
  | "baseball"
  | "american-football";

type IconProps = { className?: string; title?: string };

export function SportIcon({ sport, className = "h-5 w-5", title }: IconProps & { sport: SportName }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, role: title ? "img" : undefined, "aria-hidden": title ? undefined : true };
  return (
    <svg {...common}>
      {title && <title>{title}</title>}
      {sport === "football" && <><circle cx="12" cy="12" r="9" /><path d="m9 9 3-2 3 2-1 4h-4L9 9Zm-4.5 1.5L9 9M7 18l3-5m7 5-3-5m5.5-2.5L15 9M9 21l-2-3m8 3 2-3" /></>}
      {sport === "basketball" && <><circle cx="12" cy="12" r="9" /><path d="M4.5 6.5c5 1 8 5 9 14M19.5 17.5c-5-1-8-5-9-14M3 12h18M12 3v18" /></>}
      {sport === "tennis" && <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6c4.6 2.1 6.7 8.2 5.1 14.9M18.4 18.4c-4.6-2.1-6.7-8.2-5.1-14.9" /></>}
      {sport === "hockey" && <><path d="M7 3v10c0 2.8 2.2 5 5 5h7" /><path d="M5 3h4M16 16h5v4h-5z" /></>}
      {sport === "esports" && <><path d="M7.5 8h9a4.5 4.5 0 0 1 4.2 6.1l-1.3 3.5a2 2 0 0 1-3.2.8L14 16h-4l-2.2 2.4a2 2 0 0 1-3.2-.8l-1.3-3.5A4.5 4.5 0 0 1 7.5 8Z" /><path d="M7 11v4m-2-2h4m7-1h.01m2 2h.01" /></>}
      {sport === "baseball" && <><circle cx="12" cy="12" r="9" /><path d="M6.5 5.5c2 2 2 4.2 0 6.2m11-7.2c-2 2-2 4.2 0 6.2M6 8h3m6-1h3M5.5 14c2-2 4.2-2 6.2 0m.6 4.5c2-2 4.2-2 6.2 0M8 15v3m7-2v3" /></>}
      {sport === "american-football" && <><path d="M4.2 15.8c-2.2-2.2.4-8.3 4-11.2s8-3.3 10.5-.8-.1 8.3-3.7 11.2-8.3 3-10.8.8Z" /><path d="m8 16 8-8m-6 3 3 3m-1-5 3 3" /></>}
    </svg>
  );
}

export type InterfaceIconName = "chart" | "target" | "calendar" | "shield" | "pulse" | "trophy" | "crown" | "search";

export function InterfaceIcon({ name, className = "h-5 w-5", title }: IconProps & { name: InterfaceIconName }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, role: title ? "img" : undefined, "aria-hidden": title ? undefined : true };
  return <svg {...common}>{title && <title>{title}</title>}
    {name === "chart" && <><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" /><path d="m3 7 6-4 6 5 6-5" /></>}
    {name === "target" && <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>}
    {name === "calendar" && <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4m8-4v4M3 10h18" /></>}
    {name === "shield" && <><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.7 7.5 9.5 4.4-1.8 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>}
    {name === "pulse" && <><path d="M3 12h4l2-5 4 10 2-5h6" /></>}
    {name === "trophy" && <><path d="M8 4h8v4c0 3-1.8 5-4 5s-4-2-4-5V4Z" /><path d="M8 6H5v2c0 2 1 3 3 3m8-5h3v2c0 2-1 3-3 3m-4 2v4m-4 3h8m-6-3h4" /></>}
    {name === "crown" && <><path d="m3 6 5 4 4-7 4 7 5-4-3 12H6L3 6Z" fill="currentColor" strokeWidth="1.2" /><path d="M6 21h12" /></>}
    {name === "search" && <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>}
  </svg>;
}

