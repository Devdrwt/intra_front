import { useQuery } from '@tanstack/react-query';
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@drwindesk/ui';

export interface Weather {
  temp: number;
  code: number;
}

async function fetchWeather(): Promise<Weather> {
  // Cotonou (Bénin) — Open-Meteo, gratuit, sans clé, CORS ouvert.
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=6.37&longitude=2.39&current=temperature_2m,weather_code&timezone=Africa/Lagos';
  const r = await fetch(url);
  if (!r.ok) throw new Error('weather');
  const j = (await r.json()) as { current: { temperature_2m: number; weather_code: number } };
  return { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code };
}

/** Hook météo Cotonou réutilisable (en-tête + carte). */
export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'cotonou'],
    queryFn: fetchWeather,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/** Libellé + icône depuis le code WMO. */
export function weatherMeta(code: number): { label: string; Icon: LucideIcon; color: string } {
  if (code === 0) return { label: 'Ciel dégagé', Icon: Sun, color: 'text-amber-500' };
  if (code <= 3) return { label: 'Partiellement nuageux', Icon: CloudSun, color: 'text-amber-400' };
  if (code <= 48) return { label: 'Brouillard', Icon: CloudFog, color: 'text-slate-400' };
  if (code <= 67) return { label: 'Pluie', Icon: CloudRain, color: 'text-sky-500' };
  if (code <= 82) return { label: 'Averses', Icon: CloudRain, color: 'text-sky-500' };
  if (code >= 95) return { label: 'Orage', Icon: CloudLightning, color: 'text-indigo-500' };
  return { label: 'Nuageux', Icon: Cloud, color: 'text-slate-400' };
}

/** Météo du jour à Cotonou (la touche « dashboard moderne »). */
export function WeatherCard() {
  const { data } = useWeather();
  if (!data) return null;
  const m = weatherMeta(data.code);

  return (
    <Card className="flex items-center gap-4 bg-gradient-to-br from-sky-400/15 to-transparent">
      <m.Icon size={40} className={m.color} />
      <div className="min-w-0">
        <p className="text-2xl font-bold text-ink">{data.temp}°C</p>
        <p className="truncate text-sm text-ink-muted">Cotonou · {m.label}</p>
      </div>
    </Card>
  );
}
