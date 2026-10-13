import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import AuthScreen from "./auth/AuthScreen";
import { api, ApiError, tokenStore, type User } from "./lib/api";
import MainScreen from "./MainScreen";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(() => tokenStore.get() !== null);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<User>("/api/auth/me")
      .then(setUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) tokenStore.clear();
      })
      .finally(() => setChecking(false));
  }, []);

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* token may already be invalid */
    }
    tokenStore.clear();
    setUser(null);
  }

  return (
    <MotionConfig reducedMotion="user">
      {checking ? (
        <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-400">Loading…</div>
      ) : user ? (
        <MainScreen user={user} onLogout={logout} />
      ) : (
        <AuthScreen onAuthed={setUser} />
      )}
    </MotionConfig>
  );
}
