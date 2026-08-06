// Stable per-person color, so the same user always gets the same color across
// the Week view and Today rows without needing to hardcode user IDs.
const PALETTE = [
  { dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
  { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
  { dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700" },
  { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorForUser(userId: string) {
  return PALETTE[hash(userId) % PALETTE.length];
}
