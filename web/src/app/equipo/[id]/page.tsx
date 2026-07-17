import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MatchCard } from "@/components/match-card";
import { getTeamSchedule } from "@/lib/data";
import { crestUrl } from "@/lib/data/espn";

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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-4">
        <Image
          src={crestUrl(id)}
          alt=""
          width={56}
          height={56}
          className="object-contain"
        />
        <div>
          <h1 className="text-2xl font-bold text-silver-100">{teamName ?? "Equipo"}</h1>
          <p className="text-sm text-silver-500">
            {upcoming.length} próximos · {played.length} recientes
          </p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-silver-200">📅 Próximos partidos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {played.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-silver-200">📜 Historial reciente</h2>
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
