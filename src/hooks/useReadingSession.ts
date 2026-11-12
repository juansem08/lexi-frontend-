import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiException, getAuthToken } from '../api/client';
import { claimReward, sendHeartbeat, startReadingSession } from '../api/gamification';
import type { ClaimRewardResponse } from '../types/api';

const HEARTBEAT_MS = 30_000;
/** Sin interacción durante este tiempo, la lectura se considera en pausa. */
const IDLE_MS = 120_000;
/** Cada 5 minutos de lectura activa se registra un momento de enfoque. */
const FOCUS_MILESTONE_SECONDS = 300;

interface Options {
  enabled: boolean;
  /** Cambia cuando el estudiante empieza un texto nuevo. */
  textKey: string | null;
  documentId?: string;
  /** true cuando el lector no está a la vista (otra pestaña de la app): ese tiempo no cuenta como lectura. */
  paused?: boolean;
  onReward?: (reward: ClaimRewardResponse) => void;
}

/**
 * Sesión de lectura de la API de gamificación:
 * POST /sessions/start, heartbeats cada 30 s con segundos realmente activos
 * (pestaña visible y con interacción reciente) y momentos de enfoque.
 */
export function useReadingSession({ enabled, textKey, documentId, paused = false, onReward }: Options) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const lastBeat = useRef(0);
  const lastActivity = useRef(0);
  const pendingChunks = useRef(0);
  const pendingInteractions = useRef(0);
  const activeTotal = useRef(0);
  const milestones = useRef(0);
  const onRewardRef = useRef(onReward);
  const pausedRef = useRef(paused);

  useEffect(() => {
    onRewardRef.current = onReward;
  }, [onReward]);

  // Al salir del lector o volver a él se reinicia el reloj: el tiempo fuera no se suma.
  useEffect(() => {
    pausedRef.current = paused;
    lastBeat.current = Date.now();
  }, [paused]);

  const start = useCallback(async () => {
    try {
      const s = await startReadingSession(documentId);
      sessionRef.current = s.sessionId;
      setSessionId(s.sessionId);
      lastBeat.current = Date.now();
    } catch (err) {
      console.error('No se pudo iniciar la sesión de lectura', err);
    }
  }, [documentId]);

  const flush = useCallback(async () => {
    const id = sessionRef.current;
    // Sin sesión de estudiante (por ejemplo, justo al salir) no hay nada que enviar.
    if (!id || !getAuthToken()) return;
    const now = Date.now();
    const elapsed = Math.round((now - lastBeat.current) / 1000);
    const active =
      !pausedRef.current && document.visibilityState === 'visible' && now - lastActivity.current < IDLE_MS
        ? Math.min(300, elapsed)
        : 0;
    lastBeat.current = now;
    const chunks = Math.min(100, pendingChunks.current);
    const interactions = Math.min(500, pendingInteractions.current);
    pendingChunks.current = 0;
    pendingInteractions.current = 0;
    if (active === 0 && chunks === 0 && interactions === 0) return;

    try {
      await sendHeartbeat({ sessionId: id, activeSeconds: active, chunksProcessed: chunks, interactions });
      activeTotal.current += active;
      const reached = Math.floor(activeTotal.current / FOCUS_MILESTONE_SECONDS);
      while (milestones.current < reached) {
        milestones.current += 1;
        const reward = await claimReward('FOCUS_MILESTONE', `focus:${id}:${milestones.current}`, id);
        onRewardRef.current?.(reward);
      }
    } catch (err) {
      // 409: la sesión ya descansa; se abre otra sin perder nada.
      if (err instanceof ApiException && err.statusCode === 409) void start();
    }
  }, [start]);

  // Nueva sesión por cada texto preparado.
  useEffect(() => {
    if (!enabled || !textKey) return;
    activeTotal.current = 0;
    milestones.current = 0;
    void start();
    const timer = setInterval(() => void flush(), HEARTBEAT_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      void flush();
      sessionRef.current = null;
      setSessionId(null);
    };
  }, [enabled, textKey, start, flush]);

  // Cualquier interacción con la página cuenta como lectura activa.
  useEffect(() => {
    const mark = () => {
      lastActivity.current = Date.now();
    };
    mark();
    const events = ['pointermove', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, mark));
  }, []);

  const recordInteraction = useCallback(() => {
    pendingInteractions.current += 1;
    lastActivity.current = Date.now();
  }, []);

  const recordChunk = useCallback(() => {
    pendingChunks.current += 1;
    pendingInteractions.current += 1;
    lastActivity.current = Date.now();
  }, []);

  /** Cierra la sesión con SESSION_COMPLETED y abre una nueva para el siguiente texto. */
  const complete = useCallback(async (): Promise<ClaimRewardResponse | null> => {
    const id = sessionRef.current;
    if (!id) return null;
    await flush();
    try {
      const reward = await claimReward('SESSION_COMPLETED', `session:${id}`, id);
      sessionRef.current = null;
      setSessionId(null);
      void start();
      return reward;
    } catch (err) {
      console.error('No se pudo completar la sesión', err);
      return null;
    }
  }, [flush, start]);

  return { sessionId, recordInteraction, recordChunk, complete };
}
