import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api, ApiError, tokenStore, type User } from "../lib/api";

type Mode = "login" | "register";

const MESSAGES: Record<number, string> = {
  401: "Invalid email or password",
  409: "Email already registered",
  422: "Check your email and use at least 8 characters for the password",
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return MESSAGES[err.status] ?? err.detail;
  return "Something went wrong. Is the server running?";
}

export default function AuthScreen({ onAuthed }: { onAuthed: (user: User) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ token: string; user: User }>(`/api/auth/${mode}`, {
        method: "POST",
        body: { email, password },
      });
      tokenStore.set(res.token);
      onAuthed(res.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#020617_60%)] text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl"
      >
        <motion.div
          initial={{ rotate: -12, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", delay: 0.15 }}
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-2xl"
          aria-hidden
        >
          ⏳
        </motion.div>
        <h1 className="text-center text-3xl font-bold tracking-tight">Deadline Squad</h1>
        <p className="mt-1 text-center text-sm text-slate-400">Shared deadlines for your study group</p>

        <div role="tablist" className="relative mt-6 grid grid-cols-2 rounded-xl bg-black/30 p-1 text-sm">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className="relative z-10 rounded-lg py-2 font-medium"
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 -z-10 rounded-lg bg-indigo-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-indigo-400"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-300">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-indigo-400"
            />
          </label>

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto", x: [0, -8, 8, -4, 4, 0] }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={busy}
            whileHover={{ scale: busy ? 1 : 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2.5 font-semibold disabled:opacity-60"
          >
            <motion.span
              key={busy ? "busy" : mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
            >
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </motion.span>
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
