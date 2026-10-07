import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MatchCard } from "@/components/match-card";
import { getTeamSchedule } from "@/lib/data";
import { crestUrl } from "@/lib/data/espn";
import { InterfaceIcon, SportIcon } from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { teamName } = await getTeamSchedule(id);
  return { title: teamName ?? "Equipo" };
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { teamName, upcoming, played } = await getTeamSchedule(id);
  if (!teamName && upcoming.length === 0 && played.length === 0) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="page-heading relative flex items-center gap-4 overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(130deg,rgba(18,45,30,.9),rgba(5,15,10,.82))] p-6 md:p-8">
        <div aria-hidden className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl" />
        <Image
          src={crestUrl(id)}
          alt=""
          width={56}
          height={56}
          className="relative object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,.35)]"
        />
        <div className="relative">
          <p className="section-kicker flex items-center gap-2"><SportIcon sport="football" className="h-4 w-4" />Equipo de fútbol</p>
          <h1 className="text-2xl font-bold text-silver-100">{teamName ?? "Equipo"}</h1>
          <p className="text-sm text-silver-500">
            {upcoming.length} próximos · {played.length} recientes
          </p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold text-silver-200"><InterfaceIcon name="calendar" className="h-5 w-5 text-brand-400" />Próximos partidos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {played.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold text-silver-200"><InterfaceIcon name="chart" className="h-5 w-5 text-brand-400" />Historial reciente</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {played.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
