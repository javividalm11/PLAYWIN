import { InterfaceIcon, type InterfaceIconName } from "./icons";

export function PageHeading({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: React.ReactNode; icon: InterfaceIconName }) {
  return (
    <div className="page-heading relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(130deg,rgba(18,45,30,.9),rgba(5,15,10,.82))] px-5 py-7 sm:px-7 sm:py-9">
      <div aria-hidden className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <span className="icon-well mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-400/10 text-brand-400"><InterfaceIcon name={icon} className="h-6 w-6" /></span>
        <div><p className="section-kicker">{eyebrow}</p><h1 className="mt-1.5 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1><div className="mt-2 max-w-3xl text-sm leading-6 text-silver-400">{description}</div></div>
      </div>
    </div>
  );
}
