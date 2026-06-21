import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Factory, Gem, Gift, ShieldCheck, Zap } from "lucide-react";
import { machinesApi } from "@/api/machines.api";
import type { MachinePlanDTO } from "@/api/types";
import { MachinePlanCard } from "@/components/machines/MachinePlanCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatUSDT } from "@/utils/formatMoney";

type PlanFilter = "ALL" | "FREE" | "PAID" | "REWARD";

const filters: { value: PlanFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "FREE", label: "Gratis" },
  { value: "PAID", label: "Pagadas" },
  { value: "REWARD", label: "Recompensas" }
];

export function MachinesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<PlanFilter>("ALL");
  const { data, isLoading } = useQuery({ queryKey: ["machine-plans"], queryFn: machinesApi.plans });

  const claimFree = useMutation({
    mutationFn: machinesApi.claimFreeMachine,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["my-machines"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const plans = data || [];
  const filteredPlans = useMemo(() => {
    if (filter === "ALL") return plans;
    return plans.filter((plan) => plan.type === filter);
  }, [filter, plans]);

  const totals = useMemo(() => {
    return plans.reduce(
      (acc, plan: MachinePlanDTO) => {
        if (plan.type === "PAID") {
          acc.paidPlans += 1;
          acc.minInvestment = acc.minInvestment === 0 ? plan.priceUSDT : Math.min(acc.minInvestment, plan.priceUSDT);
          acc.maxProduction = Math.max(acc.maxProduction, plan.maxPayoutAmount);
        }
        if (plan.type === "FREE") acc.freePlans += 1;
        if (plan.type === "REWARD") acc.rewardPlans += 1;
        return acc;
      },
      { paidPlans: 0, freePlans: 0, rewardPlans: 0, minInvestment: 0, maxProduction: 0 }
    );
  }, [plans]);

  if (isLoading) return <div className="screen-center">Cargando máquinas...</div>;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-aurum-gold/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Catálogo industrial</p>
            <h1 className="mt-2 text-4xl font-black md:text-6xl">Máquinas AurumX</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Elige una máquina, revisa su producción diaria, máximo de pago y ciclo antes de activar.
            </p>
          </div>
          <Badge tone="gold">Máximo 200% por máquina</Badge>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Planes pagados" value={String(totals.paidPlans)} icon={<Factory />} hint="Máquinas principales" />
        <StatCard label="Entrada mínima" value={formatUSDT(totals.minInvestment)} icon={<ShieldCheck />} hint="Primer plan pagado" />
        <StatCard label="Mayor máximo" value={formatUSDT(totals.maxProduction)} icon={<Gem />} hint="Tope de producción" />
        <StatCard label="Recompensas" value={String(totals.rewardPlans)} icon={<Gift />} hint="Aurora por referidos" />
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-black">Selecciona tu máquina</h2>
            <p className="mt-1 text-sm text-zinc-400">Filtra por tipo y activa desde la tarjeta de cada plan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${filter === item.value ? "border-aurum-gold bg-aurum-gold text-black" : "border-white/10 bg-white/5 text-zinc-300"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredPlans.map((plan) => <MachinePlanCard key={plan.slug || plan.id} plan={plan} onClaimFree={() => claimFree.mutate()} />)}
      </div>

      {claimFree.error ? (
        <Card className="border-red-400/20 bg-red-500/10">
          <p className="text-sm text-red-300">No se pudo reclamar Pico Inicial. Si ya lo reclamaste, revisa Mis máquinas.</p>
        </Card>
      ) : null}

      {filteredPlans.length === 0 ? (
        <Card><p className="text-sm text-zinc-400">No hay máquinas disponibles para este filtro.</p></Card>
      ) : null}

      <Card className="border-aurum-gold/20">
        <div className="flex items-start gap-3">
          <Zap className="mt-1 text-aurum-gold" />
          <div>
            <h2 className="font-black text-aurum-gold">Cómo leer una máquina</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-300">
              La producción diaria base puede aumentar con potencia de referidos. Cada máquina se detiene cuando alcanza su máximo programado.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
