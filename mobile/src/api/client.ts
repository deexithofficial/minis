const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.ok) return res.json() as Promise<T>;

  let message = 'Request failed';
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data?.error === 'string') message = data.error;
  } catch {
    // Body was not JSON; keep the generic message.
  }
  throw new ApiError(res.status, message);
}
