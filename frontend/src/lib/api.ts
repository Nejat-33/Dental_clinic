export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: { path: string; message: string }[],
  ) {
    super(message);
  }
}


const BASE =
  typeof window === 'undefined'
    ? `${process.env.BACKEND_URL ?? 'http://localhost:4000'}/api`
    : '/api';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasJsonBody = init.body && !(init.body instanceof FormData);

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(hasJsonBody && { 'Content-Type': 'application/json' }), ...init.headers },
    credentials: 'include',
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Something went wrong', data?.errors);
  return data as T;
}