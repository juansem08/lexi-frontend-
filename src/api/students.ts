import { request } from './client';
import type {
  AccessibilityPreferences,
  ProvisionedStudentResponse,
  StudentProfile,
} from '../types/api';

export function getProfile(): Promise<StudentProfile> {
  return request<StudentProfile>('/students/me');
}

export function updatePreferences(
  preferences: Partial<AccessibilityPreferences>,
): Promise<StudentProfile> {
  return request<StudentProfile>('/students/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}

export interface ProvisionStudentPayload {
  studentCode: string;
  displayName: string;
  gradeLevel: number;
  classroomCode?: string;
  pin: string;
  visualSequence?: string[];
}

export function provisionStudent(
  payload: ProvisionStudentPayload,
  adminApiKey: string,
): Promise<ProvisionedStudentResponse> {
  return request<ProvisionedStudentResponse>(
    '/students',
    { method: 'POST', body: JSON.stringify(payload) },
    { 'x-admin-api-key': adminApiKey },
  );
}
