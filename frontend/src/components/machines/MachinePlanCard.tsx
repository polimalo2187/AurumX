import { ArrowRight, Factory } from "lucide-react";
import { Link } from "react-router-dom";
import type { MachinePlanDTO } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatUSDT } from "@/utils/formatMoney";

export function MachinePlanCard({ plan, onClaimFree }: { plan: MachinePlanDTO; onClaimFree?: () => void }) {
  const priceLabel = plan.type === "PAID" ? formatUSDT(plan.priceUSDT) : "0 USDT";

  return (
    <Card className="group relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-aurum-gold/10 blur-3xl transition group-hover:bg-aurum-gold/20" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-aurum-gold/10 text-aurum-gold">
            <Factory />
          </div>
          <Badge tone={plan.type === "PAID" ? "gold" : plan.type === "REWARD" ? "green" : "muted"}>{plan.type}</Badge>
        </div>
        <h3 className="text-xl font-black text-white">{plan.name}</h3>
        <p className="mt-1 text-sm text-zinc-400">Precio: {priceLabel}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-black/30 p-3">
            <span className="text-zinc-500">Produce</span>
            <strong className="block text-white">{formatUSDT(plan.baseCycleRewardAmount)}</strong>
          </div>
          <div className="rounded-2xl bg-black/30 p-3">
            <span className="text-zinc-500">Máximo</span>
            <strong className="block text-white">{formatUSDT(plan.maxPayoutAmount)}</strong>
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
    </Card>
  );
}
