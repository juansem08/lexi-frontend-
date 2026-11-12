import { getApiBaseUrl } from './client';
import type { HealthResponse } from '../types/api';

export type HealthState =
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'degraded'; message: string }
  | { kind: 'offline' };

/** GET /health — público. Distingue API caída de base de datos caída (503). */
export async function checkHealth(baseUrl = getApiBaseUrl()): Promise<HealthState> {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  try {
    const res = await fetch(`${clean}/health`, { headers: { Accept: 'application/json' } });
    if (res.ok) return { kind: 'ok', data: (await res.json()) as HealthResponse };
    return {
      kind: 'degraded',
      message:
        res.status === 503
          ? 'La API responde, pero la base de datos no.'
          : `La API respondió con el código ${res.status}.`,
    };
  } catch {
    return { kind: 'offline' };
  }
}
