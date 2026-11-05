import { request } from './client';
import type {
  StartSessionResponse,
  HeartbeatResponse,
  ClaimRewardResponse,
  StudentStatsResponse,
  RewardTaskType,
} from '../types/api';

export function startReadingSession(documentId?: string): Promise<StartSessionResponse> {
  return request<StartSessionResponse>('/gamification/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ documentId: documentId || null }),
  });
}

export function sendHeartbeat(
  sessionId: string,
  durationSeconds: number,
  interactions = 1,
  chunksProcessed = 1
): Promise<HeartbeatResponse> {
  return request<HeartbeatResponse>('/gamification/sessions/heartbeat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      durationSeconds,
      interactions,
      chunksProcessed,
    }),
  });
}

export function claimReward(
  taskId: string,
  taskType: RewardTaskType,
  sessionId?: string
): Promise<ClaimRewardResponse> {
  return request<ClaimRewardResponse>('/gamification/rewards/claim', {
    method: 'POST',
    body: JSON.stringify({
      taskId,
      taskType,
      sessionId: sessionId || null,
    }),
  });
}

export function getStudentStats(studentId: string): Promise<StudentStatsResponse> {
  return request<StudentStatsResponse>(`/gamification/students/${studentId}/stats`, {
    method: 'GET',
  });
}
