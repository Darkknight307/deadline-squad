import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api, ApiError, type Group } from "../lib/api";
import type { View } from "./route";

type Props = {
  groups: Group[];
  view: View;
  onSelect: (view: View) => void;
  onAdded: (group: Group) => void;
};

function Item({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className="relative w-full rounded-xl px-3 py-2 text-left text-sm"
      >
        {active && (
          <motion.span
            layoutId="group-active"
            className="absolute inset-0 rounded-xl bg-indigo-500/25 ring-1 ring-indigo-400/40"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative flex items-center justify-between gap-2">{children}</span>
      </button>
    </li>
  );
}

export default function Sidebar({ groups, view, onSelect, onAdded }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const g = await api<Group>("/api/groups", { method: "POST", body: { name } });
      setName("");
      onAdded(g);
    } finally {
      setBusy(false);
    }
  }

  async function join(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setJoinError(null);
    try {
      const g = await api<Group>("/api/groups/join", { method: "POST", body: { code } });
      setCode("");
      onAdded(g);
    } catch (err) {
      setJoinError(err instanceof ApiError && err.status === 404 ? "No group with this code" : "Could not join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-white/10 p-4 md:h-[calc(100vh-65px)] md:w-72 md:border-b-0 md:border-r">
      <nav aria-label="Groups">
        <ul className="space-y-1">
          <Item active={view.kind === "all"} onClick={() => onSelect({ kind: "all" })}>
            <span>🌐 All my groups</span>
          </Item>
          <AnimatePresence initial={false}>
            {groups.map((g) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <Item active={view.kind === "group" && view.id === g.id} onClick={() => onSelect({ kind: "group", id: g.id })}>
                  <span className="truncate">{g.name}</span>
                  <span className="text-xs text-slate-400">{g.is_owner ? "owner" : `${g.member_count}👥`}</span>
                </Item>
              </motion.div>
            ))}
          </AnimatePresence>
        </ul>
      </nav>

      <form onSubmit={create} className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="new-group">
          New group
        </label>
        <div className="flex gap-2">
          <input
            id="new-group"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CSS 314"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
          />
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={!name.trim() || busy}
            className="rounded-lg bg-indigo-500 px-3 text-sm font-semibold disabled:opacity-40"
          >
            Create
          </motion.button>
        </div>
      </form>

      <form onSubmit={join} className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="join-code">
          Join with code
        </label>
        <div className="flex gap-2">
          <input
            id="join-code"
            value={code}
            maxLength={12}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABC234"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-sm uppercase outline-none focus:border-indigo-400"
          />
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={!code.trim() || busy}
            className="rounded-lg bg-fuchsia-500 px-3 text-sm font-semibold disabled:opacity-40"
          >
            Join
          </motion.button>
        </div>
        <AnimatePresence>
          {joinError && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 3, 0] }}
              exit={{ opacity: 0 }}
              className="text-sm text-rose-300"
            >
              {joinError}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </aside>
  );
}
