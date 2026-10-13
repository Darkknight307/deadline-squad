import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import { api, type Deadline, type DeadlineLists } from "../lib/api";
import { splitByNow } from "../lib/countdown";
import { useNow } from "../lib/useNow";
import DeadlineCard from "./DeadlineCard";
import DeadlineForm, { type DeadlineFields } from "./DeadlineForm";

type Props = { groupId: number | null };

export default function Board({ groupId }: Props) {
  const now = useNow(1000);
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<Deadline[] | null>(null);
  const [editing, setEditing] = useState<Deadline | "new" | null>(null);
  const [showPast, setShowPast] = useState(false);

  const load = useCallback(async () => {
    const url = groupId === null ? "/api/deadlines" : `/api/groups/${groupId}/deadlines`;
    const lists = await api<DeadlineLists>(url);
    setItems([...lists.upcoming, ...lists.past]);
  }, [groupId]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  const replace = (d: Deadline) => setItems((prev) => (prev ?? []).map((x) => (x.id === d.id ? d : x)));

  async function save(fields: DeadlineFields) {
    if (editing === "new" && groupId !== null) {
      const created = await api<Deadline>(`/api/groups/${groupId}/deadlines`, { method: "POST", body: fields });
      setItems((prev) => [...(prev ?? []), created]);
    } else if (editing && editing !== "new") {
      replace(await api<Deadline>(`/api/deadlines/${editing.id}`, { method: "PATCH", body: fields }));
    }
    setEditing(null);
  }

  async function toggleDone(d: Deadline) {
    const done = !d.done;
    replace({ ...d, done });
    if (done && !reduceMotion) {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 }, colors: ["#818cf8", "#e879f9", "#34d399", "#fbbf24"] });
    }
    try {
      await api(`/api/deadlines/${d.id}/done`, { method: done ? "PUT" : "DELETE" });
    } catch {
      replace(d);
    }
  }

  async function remove(d: Deadline) {
    await api(`/api/deadlines/${d.id}`, { method: "DELETE" });
    setItems((prev) => (prev ?? []).filter((x) => x.id !== d.id));
  }

  if (items === null) return <p className="mt-8 text-slate-400">Loading deadlines…</p>;

  const { upcoming, past } = splitByNow(items, now);
  const cardProps = { now, showGroup: groupId === null, onToggleDone: toggleDone, onEdit: setEditing, onDelete: remove };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Upcoming ({upcoming.length})</h3>
        {groupId !== null && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing("new")}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-fuchsia-900/30"
          >
            + Add deadline
          </motion.button>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-3xl border border-dashed border-white/15 p-10 text-center text-slate-400"
        >
          <motion.div animate={{ rotate: [0, 180, 180, 360] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl">
            ⏳
          </motion.div>
          <p className="mt-3">No deadlines yet.{groupId !== null && " Add the first one for your group!"}</p>
        </motion.div>
      ) : (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {upcoming.map((d) => (
              <DeadlineCard key={d.id} deadline={d} {...cardProps} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {past.length > 0 && (
        <div className="mt-10">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            aria-expanded={showPast}
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
          >
            <motion.span animate={{ rotate: showPast ? 90 : 0 }}>▶</motion.span>
            Past ({past.length})
          </button>
          <AnimatePresence initial={false}>
            {showPast && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 grid gap-4 overflow-hidden lg:grid-cols-2"
              >
                <AnimatePresence mode="popLayout">
                  {past.map((d) => (
                    <DeadlineCard key={d.id} deadline={d} {...cardProps} />
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <DeadlineForm
            key="form"
            initial={editing === "new" ? undefined : editing}
            onSave={save}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
