import { request } from './client';
import type { ProcessTextResponse, ReadingLanguage } from '../types/api';

export interface ProcessTextPayload {
  text: string;
  language?: ReadingLanguage;
  options?: {
    /** 4–40 palabras por microoración. */
    maxWordsPerChunk?: number;
    /** 80–300 palabras por minuto. */
    wordsPerMinute?: number;
  };
}

export function processText(payload: ProcessTextPayload): Promise<ProcessTextResponse> {
  return request<ProcessTextResponse>('/reading-assistant/process-text', {
    method: 'POST',
    body: JSON.stringify({ language: 'es', ...payload }),
  });
}
