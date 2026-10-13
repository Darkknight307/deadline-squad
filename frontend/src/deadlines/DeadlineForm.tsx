import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import type { Deadline } from "../lib/api";
import { toLocalInput, toOffsetIso } from "../lib/countdown";

export type DeadlineFields = { title: string; course: string; due_at: string; description: string };

type Props = {
  initial?: Deadline;
  onSave: (fields: DeadlineFields) => Promise<void>;
  onClose: () => void;
};

export default function DeadlineForm({ initial, onSave, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [course, setCourse] = useState(initial?.course ?? "");
  const [due, setDue] = useState(initial ? toLocalInput(initial.due_at) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = title.trim() !== "" && course.trim() !== "" && due !== "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({ title, course, description, due_at: toOffsetIso(new Date(due)) });
    } catch {
      setError("Could not save. Check the fields and try again.");
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-indigo-400";

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        role="dialog"
        aria-label={initial ? "Edit deadline" : "Add deadline"}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-md space-y-3 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold">{initial ? "Edit deadline" : "Add deadline"}</h2>
        <label className="block text-sm">
          <span className="text-slate-300">Title</span>
          <input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className={input} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Course</span>
          <input value={course} maxLength={60} onChange={(e) => setCourse(e.target.value)} className={input} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Due</span>
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={`${input} [color-scheme:dark]`} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Description</span>
          <textarea value={description} maxLength={2000} rows={3} onChange={(e) => setDescription(e.target.value)} className={input} />
        </label>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 hover:bg-white/10">
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={!valid || busy}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 font-semibold disabled:opacity-40"
          >
            Save
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
