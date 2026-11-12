import type { ApiError } from '../types/api';

const DEFAULT_API_BASE = 'http://localhost:3000/api/v1';
const API_URL_KEY = 'lexi_api_base_url';
const TOKEN_KEY = 'lexi_access_token';

/** Se emite cuando la API rechaza el token del estudiante (401). */
export const SESSION_EXPIRED_EVENT = 'lexi:session-expired';
/** Se emite cuando cambia la URL base de la API. */
export const API_URL_CHANGED_EVENT = 'lexi:api-url-changed';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}

export function getDefaultApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const custom = safeGet(API_URL_KEY);
  if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
  return getDefaultApiBaseUrl();
}

export function setApiBaseUrl(url: string) {
  const clean = url.trim().replace(/\/+$/, '');
  safeSet(API_URL_KEY, clean && clean !== getDefaultApiBaseUrl() ? clean : null);
  window.dispatchEvent(new Event(API_URL_CHANGED_EVENT));
}

/** URL de la documentación Swagger, derivada de la base de la API. */
export function getDocsUrl(): string {
  try {
    const u = new URL(getApiBaseUrl());
    return `${u.origin}/docs`;
  } catch {
    return 'http://localhost:3000/docs';
  }
}

export function getAuthToken(): string | null {
  return safeGet(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  safeSet(TOKEN_KEY, token);
}

// Los mensajes de la API están en inglés (contrato del backend). Para los
// estudiantes se muestran en español cuando hay una traducción conocida.
const MESSAGE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/Student code or sign-in details are not correct/i, 'El código o los datos de acceso no coinciden. Revísalos con calma.'],
  [/Sign-in is paused/i, 'El acceso está en pausa unos minutos. Pide ayuda a tu docente.'],
  [/reader code is not valid or has expired/i, 'Este código QR no es válido o ya caducó.'],
  [/reader code is no longer active/i, 'Este código QR ya no está activo. Pide una tarjeta nueva.'],
  [/reader code is not valid/i, 'Este código QR no es válido.'],
  [/student session is (required|no longer valid)/i, 'Tu sesión terminó. Vuelve a entrar para seguir.'],
  [/current PIN is not correct/i, 'El PIN actual no es correcto.'],
  [/pin must contain between 4 and 6 digits/i, 'El PIN debe tener entre 4 y 6 números.'],
  [/newPin must contain/i, 'El PIN nuevo debe tener entre 4 y 6 números.'],
  [/currentPin must contain/i, 'El PIN actual debe tener entre 4 y 6 números.'],
  [/studentCode has an invalid format|studentCode must contain only/i, 'El código solo puede tener letras, números, guiones y guiones bajos.'],
  [/studentCode is already registered/i, 'Ese código de estudiante ya existe. Usa otro.'],
  [/imageSequence must contain at least 3/i, 'Elige al menos 3 dibujos.'],
  [/educator provisioning key/i, 'La clave de educador no es válida.'],
  [/image must be smaller than 10 MB/i, 'La imagen debe pesar menos de 10 MB.'],
  [/image must be a PNG, JPEG, or WebP/i, 'La imagen debe ser PNG, JPEG o WebP.'],
  [/image must be a valid image/i, 'El archivo no parece una imagen válida.'],
  [/No readable text was found/i, 'No encontramos texto legible. Prueba con una foto más clara y bien iluminada.'],
  [/No readable sentences were found/i, 'No encontramos oraciones legibles. Prueba con una foto más clara.'],
  [/image could not be read right now/i, 'No pudimos leer la imagen ahora. Inténtalo en un momento.'],
  [/audio could not be prepared/i, 'La voz no está disponible ahora. Inténtalo en un momento.'],
  [/text must contain (readable content|at least one readable word)/i, 'El texto no tiene palabras legibles.'],
  [/characters or fewer for a single audio/i, 'Esta parte es demasiado larga para escucharla de una vez.'],
  [/already resting/i, 'Esta sesión de lectura terminó. Empieza una nueva cuando quieras.'],
  [/already complete/i, 'Esta sesión de lectura ya estaba terminada.'],
  [/ThrottlerException|Too Many Requests/i, 'Demasiados intentos seguidos. Espera un minuto.'],
  [/Service dependencies are unavailable/i, 'La API está encendida, pero la base de datos no responde.'],
];

export function translateMessage(message: string): string {
  for (const [pattern, es] of MESSAGE_TRANSLATIONS) {
    if (pattern.test(message)) return es;
  }
  return message;
}

export class ApiException extends Error {
  statusCode: number;
  errorData: ApiError | null;
  rawMessages: string[];

  constructor(statusCode: number, errorData: ApiError | null, rawMessages: string[]) {
    const translated = [...new Set(rawMessages.map(translateMessage))];
    super(translated.join(' '));
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.errorData = errorData;
    this.rawMessages = rawMessages;
  }
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiException) return err.message || fallback;
  if (err instanceof TypeError) {
    return 'No hay conexión con la API. Revisa que el backend esté encendido.';
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  customHeaders: Record<string, string> = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json', ...customHeaders };

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data: unknown = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const apiError = isJson ? (data as ApiError | null) : null;
    const raw = apiError?.message;
    const messages = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? [raw]
        : [`Error ${response.status}`];

    if (response.status === 401 && token && !endpoint.startsWith('/auth/login')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiException(response.status, apiError, messages);
  }

  return data as T;
}
