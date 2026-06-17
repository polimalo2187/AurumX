import type { ReactNode } from "react";
import { cn } from "@/utils/classNames";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-panel backdrop-blur", className)}>
      {children}
    </section>
  );
}
