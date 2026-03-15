/**
 * Wrapper around fetch that always includes credentials (cookies).
 * Use this instead of raw fetch() for all API calls so the auth_token
 * cookie is always sent with requests.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
