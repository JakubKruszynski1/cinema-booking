// Cienki wrapper na fetch: dołącza access token, obsługuje JSON,
// automatycznie odświeża token po 401 (raz) i zamienia błędy API
// na czytelny wyjątek.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let accessToken: string | null = null;

// Callback synchronizujący nowy token z AuthContext po cichym odświeżeniu.
let onTokenRefreshed: ((accessToken: string) => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setTokenRefreshedHandler(cb: (accessToken: string) => void) {
  onTokenRefreshed = cb;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function rawFetch(path: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // wysyłka httpOnly cookie z refresh tokenem
  });
}

async function tryRefresh(): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken: string };
  accessToken = data.accessToken;
  onTokenRefreshed?.(data.accessToken);
  return true;
}

/**
 * Wykonuje żądanie do API. Zwraca sparsowane JSON (lub null dla 204).
 * Przy 401 na chronionym zasobie próbuje raz odświeżyć token i ponowić żądanie.
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  allowRefresh = true
): Promise<T> {
  let res = await rawFetch(path, options);

  const isAuthEndpoint =
    path.startsWith('/api/auth/login') ||
    path.startsWith('/api/auth/register') ||
    path.startsWith('/api/auth/refresh');

  if (res.status === 401 && allowRefresh && !isAuthEndpoint) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, options);
    }
  }

  if (res.status === 204) {
    return null as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data
        ? (data as { error: string }).error
        : null) ?? 'Wystąpił błąd';
    const details =
      data && typeof data === 'object' && 'details' in data
        ? (data as { details: unknown }).details
        : undefined;
    throw new ApiError(res.status, message, details);
  }

  return data as T;
}
