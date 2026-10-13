import { vi } from "vitest";

type Reply = { status?: number; body?: unknown };
type Handler = (url: string, init: RequestInit) => Reply | undefined;

/** Replaces global fetch; handlers are tried in order. Returns the vi.fn for assertions. */
export function mockFetch(...handlers: Handler[]) {
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    for (const h of handlers) {
      const reply = h(url, init);
      if (reply) {
        const status = reply.status ?? 200;
        return new Response(status === 204 ? null : JSON.stringify(reply.body ?? {}), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response(JSON.stringify({ detail: `unmocked ${init.method ?? "GET"} ${url}` }), { status: 500 });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

export const route =
  (method: string, path: string | RegExp, reply: Reply | ((init: RequestInit) => Reply)): Handler =>
  (url, init) => {
    const m = (init.method ?? "GET").toUpperCase();
    const ok = typeof path === "string" ? url === path : path.test(url);
    if (m === method && ok) return typeof reply === "function" ? reply(init) : reply;
    return undefined;
  };
