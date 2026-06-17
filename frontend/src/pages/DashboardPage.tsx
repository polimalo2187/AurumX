import { useQuery } from "@tanstack/react-query";
import { Factory, Gauge, WalletCards, Zap } from "lucide-react";
import { usersApi } from "@/api/users.api";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatUSDT } from "@/utils/formatMoney";

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: usersApi.dashboard });

  if (isLoading) return <div className="screen-center">Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">AurumX Mining</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Centro de producción</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo disponible" value={formatUSDT(data?.wallet.availableUSDT)} icon={<WalletCards />} />
        <StatCard label="Saldo bloqueado" value={formatUSDT(data?.wallet.lockedUSDT)} icon={<Gauge />} />
        <StatCard label="Máquinas activas" value={String(data?.machines.active ?? 0)} icon={<Factory />} />
        <StatCard label="Potencia" value={`+${data?.referrals.activePowerPercent ?? 0}%`} icon={<Zap />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black">Potencia por referidos</h2>
          <p className="mt-2 text-sm text-zinc-400">Solo cuentan referidos que activan máquina pagada.</p>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm text-zinc-300">
              <span>{data?.referrals.activePowerPercent ?? 0}%</span>
              <span>{data?.referrals.maxPowerPercent ?? 30}%</span>
            </div>
            <ProgressBar value={data?.referrals.activePowerPercent ?? 0} max={data?.referrals.maxPowerPercent ?? 30} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Retiros</h2>
          <p className="mt-2 text-sm text-zinc-400">Mínimo: {data?.withdrawals.minWithdrawalUSDT ?? 1} USDT. Solo un retiro cada 24 horas.</p>
          <div className="mt-5 rounded-2xl bg-black/30 p-4 text-sm text-zinc-300">
            {data?.withdrawals.canRequestWithdrawal ? "Puedes solicitar retiro." : "Retiro no disponible ahora."}
          </div>
        </Card>
      </div>
    </div>
  );
}
