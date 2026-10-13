import { motion } from "motion/react";

export default function App() {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 text-slate-100">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold"
      >
        Deadline Squad
      </motion.h1>
    </main>
  );
}
