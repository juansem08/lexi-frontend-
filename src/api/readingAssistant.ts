import { request } from './client';
import type { ProcessTextResponse, ReadingLanguage } from '../types/api';

export interface ProcessTextPayload {
  text: string;
  language?: ReadingLanguage;
  options?: {
    maxWordsPerChunk?: number;
    wordsPerMinute?: number;
  };
}

export function processText(payload: ProcessTextPayload): Promise<ProcessTextResponse> {
  return request<ProcessTextResponse>('/reading-assistant/process-text', {
    method: 'POST',
    body: JSON.stringify({
      language: 'es',
      ...payload,
    }),
  });
}
