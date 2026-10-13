export const TOKEN_KEY = "ds_token";

export type User = { id: number; email: string };
export type Group = {
  id: number;
  name: string;
  invite_code: string;
  is_owner: boolean;
  member_count: number;
};
export type Deadline = {
  id: number;
  group_id: number;
  group_name: string;
  title: string;
  course: string;
  description: string;
  due_at: string;
  author: User;
  can_edit: boolean;
  done: boolean;
};
export type DeadlineLists = { upcoming: Deadline[]; past: Deadline[] };

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

type Options = { method?: string; body?: unknown };

/** JSON fetch for /api/* with the bearer token; throws ApiError on non-2xx. */
export async function api<T = unknown>(path: string, { method = "GET", body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : res.statusText;
    throw new ApiError(res.status, detail);
  }
  return data as T;
}
