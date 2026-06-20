import { useQuery } from "@tanstack/react-query";
import { machinesApi } from "@/api/machines.api";
import type { UserMachineDTO } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCountdown } from "@/hooks/useCountdown";
import { formatUSDT } from "@/utils/formatMoney";


const MACHINE_IMAGE_MAP: Record<string, string> = {
  "pico-inicial": "/machines/pico-inicial.png",
  excavadora: "/machines/excavadora.png",
  perforadora: "/machines/perforadora.png",
  trituradora: "/machines/trituradora.png",
  "planta-elite": "/machines/planta-elite.png",
  dragalina: "/machines/dragalina.png",
  coloso: "/machines/coloso.png",
  aurora: "/machines/aurora.png"
};

function normalizeMachineSlug(value?: string) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMachineImagePath(slug?: string, name?: string) {
  const normalizedSlug = normalizeMachineSlug(slug);
  if (normalizedSlug && MACHINE_IMAGE_MAP[normalizedSlug]) return MACHINE_IMAGE_MAP[normalizedSlug];

  const normalizedName = normalizeMachineSlug(name);
  if (normalizedName && MACHINE_IMAGE_MAP[normalizedName]) return MACHINE_IMAGE_MAP[normalizedName];

  return "/machines/excavadora.png";
}

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
  const machineName = machine.name || machine.machineName || machine.machineType;
  const imageSrc = getMachineImagePath(machine.slug || machine.machineSlug, machineName);

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-52 overflow-hidden border-b border-white/10 bg-black/40">
        <img src={imageSrc} alt={machineName} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
        <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-4">
          <div className="rounded-2xl border border-aurum-gold/30 bg-black/50 px-3 py-2 text-xs font-bold uppercase tracking-[0.25em] text-aurum-gold backdrop-blur-sm">Producción activa</div>
          <Badge tone={machine.status === "ACTIVE" ? "green" : "muted"}>{machine.status}</Badge>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <h2 className="text-2xl font-black text-white">{machineName}</h2>
          <p className="mt-1 text-sm text-zinc-300">Próximo pago: {countdown}</p>
        </div>
      </div>
      <div className="p-6">
      <div className="mt-0">
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
      </div>
    </Card>
  );
}
