import { request } from './client';
import type { SynthesizeSpeechResponse, TtsVoicePersona } from '../types/api';

export interface VoiceSettings {
  persona?: TtsVoicePersona;
  speed?: number;
  pitch?: number;
}

/** La API exige exactamente una fuente: texto libre o un chunk de OCR propio. */
export type SynthesizeSource = { text: string } | { textChunkId: string };

export function synthesizeSpeech(
  source: SynthesizeSource,
  voice?: VoiceSettings,
): Promise<SynthesizeSpeechResponse> {
  return request<SynthesizeSpeechResponse>('/tts/synthesize', {
    method: 'POST',
    body: JSON.stringify(voice ? { ...source, voice } : source),
  });
}
