/**
 * Clima del partido vía Open-Meteo (gratis, sin API key).
 * Geocodifica la ciudad de la sede y consulta el pronóstico a la hora del kickoff.
 */

export type MatchWeather = {
  tempC: number;
  precipProbPct: number;
  windKmh: number;
};

const HEADERS = { "User-Agent": "PLAYWIN/1.0" };

async function geocode(city: string, country?: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es`,
      { headers: HEADERS, next: { revalidate: 60 * 60 * 24 * 30 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ latitude: number; longitude: number; country?: string }>;
    };
    const hit =
      (country && data.results?.find((r) => r.country?.toLowerCase() === country.toLowerCase())) ||
      data.results?.[0];
    return hit ? { lat: hit.latitude, lon: hit.longitude } : null;
  } catch {
    return null;
  }
}

export async function getMatchWeather(
  city: string | undefined,
  country: string | undefined,
  kickoffISO: string,
): Promise<MatchWeather | null> {
  if (!city) return null;
  const kickoff = new Date(kickoffISO);
  const hoursAway = (kickoff.getTime() - Date.now()) / 36e5;
  // Solo hay pronóstico fiable dentro de ±7 días
  if (hoursAway < -3 || hoursAway > 168) return null;

  const geo = await geocode(city, country);
  if (!geo) return null;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
        `&hourly=temperature_2m,precipitation_probability,wind_speed_10m&forecast_days=8&timezone=UTC`,
      { headers: HEADERS, next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      hourly?: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
        wind_speed_10m: number[];
      };
    };
    if (!data.hourly) return null;

    // Hora más cercana al kickoff
    const target = kickoff.toISOString().slice(0, 13); // "2026-07-16T20"
    let idx = data.hourly.time.findIndex((t) => t.startsWith(target));
    if (idx === -1) idx = 0;

    return {
      tempC: Math.round(data.hourly.temperature_2m[idx] ?? 0),
      precipProbPct: Math.round(data.hourly.precipitation_probability[idx] ?? 0),
      windKmh: Math.round(data.hourly.wind_speed_10m[idx] ?? 0),
    };
  } catch {
    return null;
  }
}
