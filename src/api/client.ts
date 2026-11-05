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

export function getAuthToken(): string | null {
  return localStorage.getItem('lexi_access_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('lexi_access_token', token);
  } else {
    localStorage.removeItem('lexi_access_token');
  }
}

export class ApiException extends Error {
  statusCode: number;
  errorData: ApiError | null;

  constructor(statusCode: number, errorData: ApiError | null, message: string) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.errorData = errorData;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  customHeaders: Record<string, string> = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    ...customHeaders,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    if (isJson && data) {
      if (Array.isArray(data.message)) {
        errorMsg = data.message.join(', ');
      } else if (typeof data.message === 'string') {
        errorMsg = data.message;
      }
    }
    throw new ApiException(response.status, isJson ? (data as ApiError) : null, errorMsg);
  }

  return data as T;
}
