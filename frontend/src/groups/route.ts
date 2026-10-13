export type View = { kind: "all" } | { kind: "group"; id: number };

export function parseHash(hash: string): View {
  const m = hash.match(/^#\/g\/(\d+)$/);
  return m ? { kind: "group", id: Number(m[1]) } : { kind: "all" };
}

export function toHash(view: View): string {
  return view.kind === "group" ? `#/g/${view.id}` : "#/all";
}
