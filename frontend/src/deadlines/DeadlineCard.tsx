import { forwardRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Deadline } from "../lib/api";
import { formatShort, getCountdown, getUrgency, type Urgency } from "../lib/countdown";
import Ticker from "./Ticker";

const STYLE: Record<Urgency, { ring: string; bar: string; chip: string; label: string }> = {
  overdue: { ring: "ring-rose-500/40", bar: "from-rose-500 to-red-600", chip: "bg-rose-500/20 text-rose-300", label: "Overdue" },
  critical: { ring: "ring-orange-500/40", bar: "from-orange-500 to-amber-500", chip: "bg-orange-500/20 text-orange-300", label: "< 24 h" },
  soon: { ring: "ring-amber-400/30", bar: "from-amber-400 to-yellow-300", chip: "bg-amber-400/20 text-amber-200", label: "< 3 days" },
  later: { ring: "ring-emerald-400/30", bar: "from-emerald-400 to-teal-400", chip: "bg-emerald-400/20 text-emerald-200", label: "Later" },
};

type Props = {
  deadline: Deadline;
  now: Date;
  showGroup: boolean;
  onToggleDone: (d: Deadline) => void;
  onEdit: (d: Deadline) => void;
  onDelete: (d: Deadline) => void;
};

const DeadlineCard = forwardRef<HTMLLIElement, Props>(function DeadlineCard(
  { deadline: d, now, showGroup, onToggleDone, onEdit, onDelete },
  ref,
) {
  const [confirming, setConfirming] = useState(false);
  const c = getCountdown(d.due_at, now);
  const urgency = getUrgency(d.due_at, now);
  const s = STYLE[urgency];
  const due = new Date(d.due_at);

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: d.done ? 0.55 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.9, transition: { duration: 0.25 } }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      aria-label={d.title}
      className={`relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 ring-1 ${s.ring} backdrop-blur`}
    >
      <motion.div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.bar}`}
        animate={urgency === "critical" && !d.done ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
        transition={urgency === "critical" ? { repeat: Infinity, duration: 1.4 } : undefined}
      />
      <div className="flex items-start gap-3">
        <label className="mt-1 cursor-pointer">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={d.done}
            onChange={() => onToggleDone(d)}
            aria-label={d.done ? `Mark ${d.title} not done` : `Mark ${d.title} done`}
          />
          <motion.span
            whileTap={{ scale: 0.8 }}
            className={`grid h-6 w-6 place-items-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 ${
              d.done ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-slate-500"
            }`}
          >
            <AnimatePresence>
              {d.done && (
                <motion.svg viewBox="0 0 24 24" className="h-4 w-4" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <motion.path
                    d="M5 13l4 4L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.span>
        </label>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-medium text-indigo-200">{d.course}</span>
            {showGroup && <span className="text-slate-400">{d.group_name}</span>}
            <span className={`rounded-full px-2 py-0.5 font-medium ${s.chip}`}>{s.label}</span>
          </div>
          <h3 className={`mt-2 text-lg font-semibold leading-snug ${d.done ? "line-through decoration-2" : ""}`}>{d.title}</h3>
          {d.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{d.description}</p>}
          <p className="mt-2 text-xs text-slate-400">
            {due.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {" · by "}
            {d.author.email}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        {c.overdue ? (
          <p className="text-sm font-semibold text-rose-300">Overdue by {formatShort(c)}</p>
        ) : (
          <div className="flex gap-1.5" aria-label={`Due in ${formatShort(c)}`}>
            <Ticker value={c.days} label="days" />
            <Ticker value={c.hours} label="hrs" />
            <Ticker value={c.minutes} label="min" />
            <Ticker value={c.seconds} label="sec" />
          </div>
        )}
        {d.can_edit && (
          <div className="flex gap-1 text-sm">
            <AnimatePresence mode="wait" initial={false}>
              {confirming ? (
                <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-1">
                  <span className="text-slate-300">Delete?</span>
                  <button type="button" onClick={() => onDelete(d)} className="rounded-lg bg-rose-500 px-2 py-1 font-semibold">
                    Yes, delete
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-2 py-1 hover:bg-white/10">
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.div key="actions" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex gap-1">
                  <button type="button" onClick={() => onEdit(d)} className="rounded-lg px-2 py-1 hover:bg-white/10">
                    Edit
                  </button>
                  <button type="button" onClick={() => setConfirming(true)} className="rounded-lg px-2 py-1 text-rose-300 hover:bg-rose-500/10">
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.li>
  );
});

export default DeadlineCard;
