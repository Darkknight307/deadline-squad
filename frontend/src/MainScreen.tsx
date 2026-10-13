import { motion } from "motion/react";
import type { User } from "./lib/api";

export default function MainScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <span className="text-lg font-bold">⏳ Deadline Squad</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">{user.email}</span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/10"
          >
            Log out
          </motion.button>
        </div>
      </header>
    </div>
  );
}
