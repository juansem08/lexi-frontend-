import { request } from './client';
import type {
  AuthResponse,
  PinChangedResponse,
  QrTokenResponse,
  VisualTokenResponse,
} from '../types/api';

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export function loginWithPin(studentCode: string, pin: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login/pin', post({ studentCode, pin }));
}

export function loginWithQr(qrToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login/qr', post({ qrToken }));
}

export function loginWithVisual(
  studentCode: string,
  imageSequence: string[],
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login/visual', post({ studentCode, imageSequence }));
}

/** rotate=true invalida todas las tarjetas QR impresas anteriormente. */
export function generateQrToken(rotate = false): Promise<QrTokenResponse> {
  return request<QrTokenResponse>('/auth/qr-token', post({ rotate }));
}

export function setVisualToken(imageSequence: string[]): Promise<VisualTokenResponse> {
  return request<VisualTokenResponse>('/auth/visual-token', post({ imageSequence }));
}

export function changePin(currentPin: string, newPin: string): Promise<PinChangedResponse> {
  return request<PinChangedResponse>('/auth/pin', {
    method: 'PATCH',
    body: JSON.stringify({ currentPin, newPin }),
  });
}
