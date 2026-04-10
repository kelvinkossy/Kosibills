const AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-2fa',
  '/api/auth/refresh-token',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
];

let _csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  _csrfToken = data.token;
  return _csrfToken!;
}

export async function getCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  return fetchCsrfToken();
}

export function invalidateCsrfToken() {
  _csrfToken = null;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const isAuthPath = AUTH_PATHS.some(p => url.includes(p));

  const headers = new Headers(options.headers as HeadersInit);

  if (isMutation && !isAuthPath) {
    const token = await getCsrfToken();
    headers.set('x-csrf-token', token);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 403) {
    const cloned = response.clone();
    try {
      const data = await cloned.json();
      if (data?.error?.includes('CSRF')) {
        invalidateCsrfToken();
      }
    } catch {}
  }

  return response;
}
