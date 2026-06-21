import type { ReactNode } from "react";
import { ArrowRight, Clock, Gem, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import type { MachinePlanDTO } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatUSDT } from "@/utils/formatMoney";
import { dailyReturnPercent, formatPercent, getMachineImagePath, getPlanTypeLabel, getPlanTypeTone } from "@/utils/machines";

export function MachinePlanCard({ plan, onClaimFree }: { plan: MachinePlanDTO; onClaimFree?: () => void }) {
  const priceLabel = plan.type === "PAID" ? formatUSDT(plan.priceUSDT) : "0 USDT";
  const imageSrc = getMachineImagePath(plan.slug, plan.name);
  const planId = plan.id || plan._id || plan.slug;
  const principal = plan.virtualPrincipalUSDT || plan.priceUSDT || 0;
  const dailyPercent = dailyReturnPercent(plan);
  const totalRoi = principal > 0 ? (plan.maxPayoutAmount / principal) * 100 : 0;

  return (
    <Card className="group relative overflow-hidden p-0">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-aurum-gold/10 blur-3xl transition group-hover:bg-aurum-gold/20" />
      <div className="relative">
        <div className="relative h-56 overflow-hidden border-b border-white/10 bg-black/40">
          <img src={imageSrc} alt={plan.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute left-5 top-5">
            <Badge tone={getPlanTypeTone(plan.type)}>{getPlanTypeLabel(plan.type)}</Badge>
          </div>
          <div className="absolute right-5 top-5">
            <Badge tone={plan.powerEnabled ? "green" : "muted"}>{plan.powerEnabled ? "Potencia activa" : "Base"}</Badge>
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <h3 className="text-2xl font-black text-white">{plan.name}</h3>
            <p className="mt-1 text-sm text-zinc-300">Inversión: {priceLabel}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-2xl border border-aurum-gold/20 bg-aurum-gold/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-aurum-gold">Producción diaria base</p>
                <strong className="mt-1 block text-2xl text-white">{formatUSDT(plan.baseCycleRewardAmount)}</strong>
              </div>
              <div className="rounded-2xl bg-black/30 p-3 text-aurum-gold"><Zap size={22} /></div>
            </div>
            <p className="mt-2 text-xs text-zinc-400">Equivale a {formatPercent(dailyPercent)} diario sobre el valor de la máquina.</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Metric icon={<Gem size={16} />} label="Máximo 200%" value={formatUSDT(plan.maxPayoutAmount)} />
            <Metric icon={<Clock size={16} />} label="Duración" value={`${plan.durationCycles} ciclos`} />
            <Metric icon={<ShieldCheck size={16} />} label="Pago cada" value={`${plan.cycleHours}h`} />
            <Metric icon={<Zap size={16} />} label="ROI total" value={formatPercent(totalRoi)} />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-zinc-400">
              <span>Proyección total</span>
              <span>{formatPercent(totalRoi)}</span>
            </div>
            <ProgressBar value={totalRoi} max={200} />
          </div>

          <div className="mt-5">
            {plan.type === "PAID" ? (
              <Link to={`/deposits/new/${planId}`}>
                <Button className="w-full">Activar máquina <ArrowRight size={16} className="ml-2" /></Button>
              </Link>
            ) : plan.type === "FREE" ? (
              <Button className="w-full" variant="secondary" onClick={onClaimFree}>Reclamar Pico Inicial</Button>
            ) : (
              <Link to="/referrals"><Button className="w-full" variant="ghost">Desbloquear por referidos</Button></Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <span className="flex items-center gap-1 text-zinc-500">{icon}{label}</span>
      <strong className="mt-1 block text-white">{value}</strong>
    </div>
  );
}
