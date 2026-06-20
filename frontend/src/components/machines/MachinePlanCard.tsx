import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { MachinePlanDTO } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatUSDT } from "@/utils/formatMoney";
import { getMachineImagePath } from "@/utils/machineImages";

export function MachinePlanCard({ plan, onClaimFree }: { plan: MachinePlanDTO; onClaimFree?: () => void }) {
  const priceLabel = plan.type === "PAID" ? formatUSDT(plan.priceUSDT) : "0 USDT";
  const imageSrc = getMachineImagePath(plan.slug, plan.name);

  return (
    <Card className="group relative overflow-hidden p-0">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-aurum-gold/10 blur-3xl transition group-hover:bg-aurum-gold/20" />
      <div className="relative">
        <div className="relative h-56 overflow-hidden border-b border-white/10 bg-black/40">
          <img src={imageSrc} alt={plan.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-4">
            <div className="rounded-2xl border border-aurum-gold/30 bg-black/50 px-3 py-2 text-xs font-bold uppercase tracking-[0.25em] text-aurum-gold backdrop-blur-sm">AurumX</div>
            <Badge tone={plan.type === "PAID" ? "gold" : plan.type === "REWARD" ? "green" : "muted"}>{plan.type}</Badge>
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <h3 className="text-2xl font-black text-white">{plan.name}</h3>
            <p className="mt-1 text-sm text-zinc-300">Precio: {priceLabel}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-black/30 p-3">
            <span className="text-zinc-500">Produce</span>
            <strong className="block text-white">{formatUSDT(plan.baseCycleRewardAmount)}</strong>
          </div>
          <div className="rounded-2xl bg-black/30 p-3">
            <span className="text-zinc-500">Máximo</span>
            <strong className="block text-white">{formatUSDT(plan.maxPayoutAmount)}</strong>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-black/30 p-3">
            <span className="text-zinc-500">Duración</span>
            <strong className="block text-white">{plan.durationCycles} días</strong>
          </div>
          <div className="rounded-2xl bg-black/30 p-3">
            <span className="text-zinc-500">Ciclo</span>
            <strong className="block text-white">Cada {plan.cycleHours}h</strong>
          </div>
        </div>

        <div className="mt-5">
          {plan.type === "PAID" ? (
            <Link to={`/deposits/new/${plan.id || plan._id}`}>
              <Button className="w-full">Activar <ArrowRight size={16} className="ml-2" /></Button>
            </Link>
          ) : plan.type === "FREE" ? (
            <Button className="w-full" variant="secondary" onClick={onClaimFree}>Reclamar Pico Inicial</Button>
          ) : (
            <Button className="w-full" variant="ghost">Disponible por referidos</Button>
          )}
        </div>
        </div>
      </div>
    </Card>
  );
}
