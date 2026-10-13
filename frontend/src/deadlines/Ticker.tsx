import { AnimatePresence, motion } from "motion/react";

/** A number that slides up when it changes (flip-clock feel). */
export default function Ticker({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-9 w-11 overflow-hidden rounded-lg bg-black/40 font-mono text-2xl font-bold tabular-nums">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={text}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="absolute inset-0 grid place-items-center"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}
