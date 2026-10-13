import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { api, type Group, type User } from "./lib/api";
import Sidebar from "./groups/Sidebar";
import GroupHeader from "./groups/GroupHeader";
import { parseHash, toHash, type View } from "./groups/route";
import Board from "./deadlines/Board";

export default function MainScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [view, setView] = useState<View>(() => parseHash(window.location.hash));

  const loadGroups = useCallback(async () => {
    setGroups(await api<Group[]>("/api/groups"));
  }, []);

  useEffect(() => {
    loadGroups();
    const onHash = () => setView(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [loadGroups]);

  function select(next: View) {
    window.location.hash = toHash(next);
    setView(next);
  }

  function added(g: Group) {
    setGroups((prev) => {
      const rest = (prev ?? []).filter((x) => x.id !== g.id);
      return [...rest, g].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    });
    select({ kind: "group", id: g.id });
  }

  const group = view.kind === "group" ? groups?.find((g) => g.id === view.id) : undefined;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#1e1b4b_0%,_#020617_55%)] text-slate-100">
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
      <div className="flex flex-col md:flex-row">
        <Sidebar groups={groups ?? []} view={view} onSelect={select} onAdded={added} />
        <main className="flex-1 p-6 md:p-10">
          {groups === null ? (
            <p className="text-slate-400">Loading…</p>
          ) : groups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-16 max-w-md rounded-3xl border border-dashed border-white/15 p-10 text-center"
            >
              <div className="text-5xl">👋</div>
              <h2 className="mt-4 text-xl font-semibold">No groups yet</h2>
              <p className="mt-2 text-sm text-slate-400">
                Create a group for your class on the left and share its invite code, or join your groupmates with
                their code.
              </p>
            </motion.div>
          ) : view.kind === "group" && group ? (
            <>
              <GroupHeader group={group} />
              <Board key={group.id} groupId={group.id} />
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight">All my groups</h2>
              <Board key="all" groupId={null} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
