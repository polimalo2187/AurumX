import { useQuery } from "@tanstack/react-query";
import { machinesApi } from "@/api/machines.api";
import type { UserMachineDTO } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCountdown } from "@/hooks/useCountdown";
import { formatUSDT } from "@/utils/formatMoney";

export function MyMachinesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["my-machines"], queryFn: machinesApi.myMachines });

  if (isLoading) return <div className="screen-center">Cargando tus máquinas...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Producción activa</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Mis máquinas</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(data || []).map((machine) => <MachineCard key={machine.id} machine={machine} />)}
      </div>
      {data?.length === 0 ? <Card><p className="text-zinc-400">Todavía no tienes máquinas activas.</p></Card> : null}
    </div>
  );
}

function MachineCard({ machine }: { machine: UserMachineDTO }) {
  const countdown = useCountdown(machine.nextRewardAt);
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">{machine.name || machine.machineType}</h2>
          <p className="mt-1 text-sm text-zinc-400">Próximo pago: {countdown}</p>
        </div>
        <Badge tone={machine.status === "ACTIVE" ? "green" : "muted"}>{machine.status}</Badge>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm text-zinc-300">
          <span>{formatUSDT(machine.paidAmount)}</span>
          <span>{formatUSDT(machine.maxPayoutAmount)}</span>
        </div>
        <ProgressBar value={machine.paidAmount} max={machine.maxPayoutAmount} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-black/30 p-3"><span className="text-zinc-500">Ciclo</span><strong className="block text-white">{formatUSDT(machine.effectiveCycleRewardAmount)}</strong></div>
        <div className="rounded-2xl bg-black/30 p-3"><span className="text-zinc-500">Potencia</span><strong className="block text-white">+{machine.powerPercentApplied}%</strong></div>
      </div>
    </Card>
  );
}
