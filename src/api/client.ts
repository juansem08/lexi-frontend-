import type { ApiError } from '../types/api';

const DEFAULT_API_BASE = 'http://localhost:3000/api/v1';

export function getApiBaseUrl(): string {
  const custom = localStorage.getItem('lexi_api_base_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
}

export function setApiBaseUrl(url: string) {
  if (!url || !url.trim()) {
    localStorage.removeItem('lexi_api_base_url');
  } else {
    localStorage.setItem('lexi_api_base_url', url.trim().replace(/\/+$/, ''));
  }
}
