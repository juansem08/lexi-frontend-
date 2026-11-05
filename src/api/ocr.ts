import { request } from './client';
import type { OcrExtractResponse } from '../types/api';

export function extractOcr(imageFile: File): Promise<OcrExtractResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  return request<OcrExtractResponse>('/ocr/extract', {
    method: 'POST',
    body: formData,
  });
}
