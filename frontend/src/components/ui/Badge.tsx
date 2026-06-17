import type { ReactNode } from "react";
import { cn } from "@/utils/classNames";

type BadgeTone = "gold" | "green" | "red" | "muted";

const tones: Record<BadgeTone, string> = {
  gold: "border-aurum-gold/30 bg-aurum-gold/10 text-aurum-gold",
  green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  red: "border-red-400/30 bg-red-400/10 text-red-300",
  muted: "border-white/10 bg-white/5 text-zinc-300"
};

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}
