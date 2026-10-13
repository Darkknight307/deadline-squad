import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Group } from "../lib/api";

export default function GroupHeader({ group }: { group: Group }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      key={group.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{group.name}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {group.member_count} {group.member_count === 1 ? "member" : "members"}
          {group.is_owner && " · you are the owner"}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <span className="text-xs uppercase tracking-wide text-slate-400">Invite code</span>
        <code className="font-mono text-lg font-bold tracking-[0.2em] text-fuchsia-300">{group.invite_code}</code>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={copy}
          className="relative w-20 rounded-lg bg-white/10 px-2 py-1 text-sm hover:bg-white/20"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={copied ? "c" : "n"}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="inline-block"
            >
              {copied ? "Copied!" : "Copy"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
