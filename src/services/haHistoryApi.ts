import type { HAHistoryPoint } from '../types';
import { getActiveHAConnection } from './haWebSocket';

// Simple in-memory cache: key -> { data, timestamp }
const cache = new Map<string, { data: HAHistoryPoint[]; ts: number }>();
const CACHE_TTL = 60_000; // 60s

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)(h|d|w)$/);
  if (!match) return 24 * 3600 * 1000;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'h') return val * 3600 * 1000;
  if (unit === 'd') return val * 24 * 3600 * 1000;
  if (unit === 'w') return val * 7 * 24 * 3600 * 1000;
  return 24 * 3600 * 1000;
}

export async function fetchHistory(entityId: string, period: string): Promise<HAHistoryPoint[]> {
  const cacheKey = `${entityId}:${period}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const conn = getActiveHAConnection();
  if (!conn?.isConnected) throw new Error('HA not connected');

  const startTime = new Date(Date.now() - parsePeriod(period)).toISOString();
  const endTime = new Date().toISOString();

  const result = await conn.request({
    type: 'history/history_during_period',
    start_time: startTime,
    end_time: endTime,
    entity_ids: [entityId],
    minimal_response: true,
    no_attributes: true,
  }) as Record<string, Array<{ s: string; lu: number }>>;

  // WS minimal_response returns { entity_id: [{ s: state, lu: last_updated_ts }] }
  const raw = result[entityId] ?? [];
  const points: HAHistoryPoint[] = raw.map((r) => ({
    state: r.s,
    last_changed: new Date(r.lu * 1000).toISOString(),
  }));

  cache.set(cacheKey, { data: points, ts: Date.now() });
  return points;
}

/** Generate synthetic temperature history for demo mode (sine wave 19-23 °C). */
export function generateDemoHistory(period: string): HAHistoryPoint[] {
  const match = period.match(/^(\d+)([hdw])$/);
  const hours = match
    ? { h: 1, d: 24, w: 168 }[match[2] as 'h' | 'd' | 'w']! * parseInt(match[1])
    : 24;

  const now = Date.now();
  const points: HAHistoryPoint[] = [];
  const count = Math.min(hours * 6, 200);

  for (let i = 0; i <= count; i++) {
    const t = now - (count - i) * (hours * 3600000) / count;
    const value = 21 + 2 * Math.sin((2 * Math.PI * (t / 3600000 - 6)) / 24);
    points.push({
      state: value.toFixed(1),
      last_changed: new Date(t).toISOString(),
    });
  }
  return points;
}
