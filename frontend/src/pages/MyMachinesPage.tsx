import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Factory, Gem, PlusCircle, TrendingUp, WalletCards, Zap } from "lucide-react";
import { machinesApi } from "@/api/machines.api";
import type { UserMachineDTO } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { useCountdown } from "@/hooks/useCountdown";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";
import { getMachineImagePath, getMachineName, getMachineStatusLabel, getMachineStatusTone, payoutPercent } from "@/utils/machines";

type MachineFilter = "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED";

const filters: { value: MachineFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "ACTIVE", label: "Activas" },
  { value: "COMPLETED", label: "Completadas" },
  { value: "CANCELLED", label: "Canceladas" }
];

export function MyMachinesPage() {
  const [filter, setFilter] = useState<MachineFilter>("ACTIVE");
  const { data, isLoading } = useQuery({ queryKey: ["my-machines"], queryFn: machinesApi.myMachines });

  const machines = data || [];
  const filteredMachines = useMemo(() => {
    if (filter === "ALL") return machines;
    return machines.filter((machine) => machine.status === filter);
  }, [filter, machines]);

  const totals = useMemo(() => {
    return machines.reduce(
      (acc, machine) => {
        acc.total += 1;
        if (machine.status === "ACTIVE") acc.active += 1;
        if (machine.status === "COMPLETED") acc.completed += 1;
        acc.produced += machine.paidAmount || 0;
        acc.remaining += machine.remainingAmount || 0;
        acc.daily += machine.status === "ACTIVE" ? machine.effectiveCycleRewardAmount || 0 : 0;
        return acc;
      },
      { total: 0, active: 0, completed: 0, produced: 0, remaining: 0, daily: 0 }
    );
  }, [machines]);

  if (isLoading) return <div className="screen-center">Cargando tus máquinas...</div>;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-aurum-gold/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Producción activa</p>
            <h1 className="mt-2 text-4xl font-black md:text-6xl">Mis máquinas</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Controla producción diaria, progreso hacia el máximo y próximos pagos.
            </p>
          </div>
          <Link to="/machines"><Button><PlusCircle size={16} className="mr-2" />Activar nueva</Button></Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Máquinas activas" value={String(totals.active)} icon={<Factory />} hint={`${totals.completed} completadas`} />
        <StatCard label="Producido total" value={formatUSDT(totals.produced)} icon={<Gem />} hint="Acreditado históricamente" />
        <StatCard label="Producción diaria" value={formatUSDT(totals.daily)} icon={<TrendingUp />} hint="Estimado base activo" />
        <StatCard label="Por producir" value={formatUSDT(totals.remaining)} icon={<WalletCards />} hint="Hasta máximo programado" />
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-black">Estado de máquinas</h2>
            <p className="mt-1 text-sm text-zinc-400">Filtra tu flota por estado de producción.</p>
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

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredMachines.map((machine) => <MachineCard key={machine.id} machine={machine} />)}
      </div>

      {machines.length === 0 ? (
        <Card>
          <div className="text-center">
            <Factory className="mx-auto text-aurum-gold" size={36} />
            <h2 className="mt-4 text-2xl font-black">Todavía no tienes máquinas</h2>
            <p className="mt-2 text-sm text-zinc-400">Reclama Pico Inicial o activa una máquina pagada para comenzar producción.</p>
            <Link to="/machines"><Button className="mt-5">Ver catálogo</Button></Link>
          </div>
        </Card>
      ) : filteredMachines.length === 0 ? (
        <Card><p className="text-sm text-zinc-400">No hay máquinas en este estado.</p></Card>
      ) : null}
    </div>
  );
}

function MachineCard({ machine }: { machine: UserMachineDTO }) {
  const countdown = useCountdown(machine.nextRewardAt);
  const machineName = getMachineName(machine);
  const imageSrc = getMachineImagePath(machine.slug || machine.machineSlug, machineName);
  const percent = payoutPercent(machine.paidAmount, machine.maxPayoutAmount);

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-52 overflow-hidden border-b border-white/10 bg-black/40">
        <img src={imageSrc} alt={machineName} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
        <div className="absolute right-5 top-5">
          <Badge tone={getMachineStatusTone(machine.status)}>{getMachineStatusLabel(machine.status)}</Badge>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <h2 className="text-2xl font-black text-white">{machineName}</h2>
          <p className="mt-1 text-sm text-zinc-300">
            {machine.status === "ACTIVE" ? `Próximo pago: ${countdown}` : `Finalizada: ${formatDateTime(machine.completedAt)}`}
          </p>
        </div>
      </div>

      <div className="p-6">
        <div>
          <div className="mb-2 flex justify-between text-sm text-zinc-300">
            <span>{formatUSDT(machine.paidAmount)} producido</span>
            <span>{percent.toFixed(1)}%</span>
          </div>
          <ProgressBar value={machine.paidAmount} max={machine.maxPayoutAmount} />
          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            <span>Objetivo máximo</span>
            <span>{formatUSDT(machine.maxPayoutAmount)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info icon={<Zap size={16} />} label="Pago diario" value={formatUSDT(machine.effectiveCycleRewardAmount)} />
          <Info icon={<TrendingUp size={16} />} label="Potencia" value={`+${machine.powerPercentApplied}%`} />
          <Info icon={<WalletCards size={16} />} label="Restante" value={formatUSDT(machine.remainingAmount)} />
          <Info icon={<Clock size={16} />} label="Activada" value={formatDateTime(machine.activatedAt)} />
        </div>
      </div>
    </Card>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <span className="flex items-center gap-1 text-zinc-500">{icon}{label}</span>
      <strong className="mt-1 block text-white">{value}</strong>
    </div>
  );
}
