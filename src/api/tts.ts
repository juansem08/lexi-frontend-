import { request } from './client';
import type { SynthesizeSpeechResponse } from '../types/api';

export interface SynthesizeSpeechPayload {
  textChunkId?: string;
  text?: string;
  voice?: {
    speed?: number;
    pitch?: number;
  };
}

export function synthesizeSpeech(payload: SynthesizeSpeechPayload): Promise<SynthesizeSpeechResponse> {
  return request<SynthesizeSpeechResponse>('/tts/synthesize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
