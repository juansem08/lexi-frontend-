import { request } from './client';
import type { AuthResponse } from '../types/api';

export interface LoginPinPayload {
  studentCode: string;
  pin: string;
}

export interface LoginQrPayload {
  qrToken: string;
}

export interface LoginVisualPayload {
  studentCode: string;
  imageSequence: string[];
}

export interface QrTokenResponse {
  qrToken: string;
  studentCode: string;
  expiresAt: string;
  expiresIn: number;
}

export function loginWithPin(data: LoginPinPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login/pin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginWithQr(data: LoginQrPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login/qr', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginWithVisual(data: LoginVisualPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login/visual', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getQrToken(rotate = false): Promise<QrTokenResponse> {
  return request<QrTokenResponse>('/auth/qr-token', {
    method: 'POST',
    body: JSON.stringify({ rotate }),
  });
}

export function setVisualToken(imageSequence: string[]): Promise<{ message: string; visualTokenConfigured: boolean }> {
  return request<{ message: string; visualTokenConfigured: boolean }>('/auth/visual-token', {
    method: 'POST',
    body: JSON.stringify({ imageSequence }),
  });
}

export function changePin(currentPin: string, newPin: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/pin', {
    method: 'PATCH',
    body: JSON.stringify({ currentPin, newPin }),
  });
}
