import { request } from './client';
import type {
  ClaimRewardResponse,
  HeartbeatResponse,
  RewardTaskType,
  StartSessionResponse,
  StudentStatsResponse,
} from '../types/api';

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export function startReadingSession(documentId?: string): Promise<StartSessionResponse> {
  return request<StartSessionResponse>(
    '/gamification/sessions/start',
    post(documentId ? { documentId } : {}),
  );
}

export interface HeartbeatPayload {
  sessionId: string;
  /** 0–300 segundos de lectura activa desde el heartbeat anterior. */
  activeSeconds: number;
  chunksProcessed?: number;
  interactions?: number;
}

export function sendHeartbeat(payload: HeartbeatPayload): Promise<HeartbeatResponse> {
  return request<HeartbeatResponse>('/gamification/sessions/heartbeat', post(payload));
}

/** taskId es idempotente: repetirlo nunca otorga XP dos veces. */
export function claimReward(
  taskType: RewardTaskType,
  taskId: string,
  sessionId?: string,
): Promise<ClaimRewardResponse> {
  return request<ClaimRewardResponse>(
    '/gamification/rewards/claim',
    post(sessionId ? { taskType, taskId, sessionId } : { taskType, taskId }),
  );
}

export function getStudentStats(studentId: string): Promise<StudentStatsResponse> {
  return request<StudentStatsResponse>(`/gamification/students/${studentId}/stats`);
}
