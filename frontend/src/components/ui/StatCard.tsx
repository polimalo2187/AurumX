import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function StatCard({ label, value, icon, hint }: { label: string; value: string; icon?: ReactNode; hint?: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-aurum-gold/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <strong className="mt-2 block text-2xl text-white">{value}</strong>
          {hint ? <span className="mt-2 block text-xs text-zinc-500">{hint}</span> : null}
        </div>
        {icon ? <div className="rounded-2xl bg-aurum-gold/10 p-3 text-aurum-gold">{icon}</div> : null}
      </div>
    </Card>
  );
}
