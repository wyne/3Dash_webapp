export interface WeatherData {
  weather_code: number;
  cloud_cover: number;
  rain: number;
  snowfall: number;
}

// WMO weather codes for precipitation types
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

export function isRaining(code: number): boolean {
  return RAIN_CODES.has(code);
}

export function isSnowing(code: number): boolean {
  return SNOW_CODES.has(code);
}

// Client-side cache (10 min TTL, same as old server cache)
let cache: { data: WeatherData; ts: number } | null = null;
const CACHE_TTL = 600_000;

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,cloud_cover,rain,snowfall`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const json = await res.json();
  const data: WeatherData = json.current;
  cache = { data, ts: Date.now() };
  return data;
}
