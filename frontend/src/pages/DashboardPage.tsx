import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Factory, Gauge, Gem, Landmark, Megaphone, WalletCards, Zap } from "lucide-react";
import { usersApi } from "@/api/users.api";
import { machinesApi } from "@/api/machines.api";
import { walletApi } from "@/api/wallet.api";
import { withdrawalsApi } from "@/api/withdrawals.api";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCountdown } from "@/hooks/useCountdown";
import { formatUSDT } from "@/utils/formatMoney";

export function DashboardPage() {
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: usersApi.dashboard });
  const machines = useQuery({ queryKey: ["my-machines"], queryFn: machinesApi.myMachines });
  const transactions = useQuery({ queryKey: ["wallet-transactions"], queryFn: walletApi.transactions });
  const withdrawals = useQuery({ queryKey: ["withdrawals"], queryFn: withdrawalsApi.myWithdrawals });

  const data = dashboard.data;
  const activeMachines = (machines.data || []).filter((machine) => machine.status === "ACTIVE");
  const nextMachine = activeMachines
    .filter((machine) => machine.nextRewardAt)
    .sort((a, b) => new Date(a.nextRewardAt || 0).getTime() - new Date(b.nextRewardAt || 0).getTime())[0];
  const countdown = useCountdown(nextMachine?.nextRewardAt);

  const totals = useMemo(() => {
    const items = transactions.data?.items || [];
    return items.reduce(
      (acc, tx) => {
        if (tx.type.includes("REWARD")) acc.produced += tx.amount;
        if (tx.direction === "CREDIT") acc.credits += tx.amount;
        if (tx.direction === "DEBIT") acc.debits += tx.amount;
        return acc;
      },
      { produced: 0, credits: 0, debits: 0 }
    );
  }, [transactions.data?.items]);

  const pendingWithdrawal = (withdrawals.data?.items || []).find((item) => item.status === "PENDING");

  if (dashboard.isLoading) return <div className="screen-center">Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-aurum-gold/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">AurumX Mining</p>
            <h1 className="mt-3 text-4xl font-black md:text-6xl">Centro de producción</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">Monitorea tu saldo, máquinas activas, recompensas y poder de referidos desde una sola consola.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/machines"><Button>Activar máquina <ArrowRight size={16} className="ml-2" /></Button></Link>
              <Link to="/withdrawals"><Button variant="secondary">Solicitar retiro</Button></Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
            <p className="text-sm text-zinc-400">Próximo pago</p>
            <strong className="mt-2 block text-3xl text-aurum-gold">{nextMachine ? countdown : "Sin máquinas"}</strong>
            <p className="mt-2 text-sm text-zinc-400">{nextMachine ? `${nextMachine.name || nextMachine.machineName || "Máquina"} · ${formatUSDT(nextMachine.effectiveCycleRewardAmount)}` : "Activa una máquina para iniciar producción."}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo disponible" value={formatUSDT(data?.wallet.availableUSDT)} icon={<WalletCards />} hint="Listo para retiro" />
        <StatCard label="Saldo bloqueado" value={formatUSDT(data?.wallet.lockedUSDT)} icon={<Gauge />} hint="Retiros pendientes" />
        <StatCard label="Total producido" value={formatUSDT(totals.produced)} icon={<Gem />} hint="Recompensas acreditadas" />
        <StatCard label="Máquinas activas" value={String(data?.machines.active ?? 0)} icon={<Factory />} hint={`${data?.machines.completed ?? 0} completadas`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Potencia por referidos</h2>
              <p className="mt-2 text-sm text-zinc-400">Solo cuentan referidos que verifican Telegram y activan una máquina pagada.</p>
            </div>
            <Zap className="text-aurum-gold" />
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm text-zinc-300">
              <span>{data?.referrals.activePowerPercent ?? 0}% activo</span>
              <span>{data?.referrals.maxPowerPercent ?? 30}% máximo</span>
            </div>
            <ProgressBar value={data?.referrals.activePowerPercent ?? 0} max={data?.referrals.maxPowerPercent ?? 30} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-black/30 p-3"><span className="text-zinc-500">Válidos</span><strong className="block text-white">{data?.referrals.validReferralCount ?? 0}</strong></div>
            <div className="rounded-2xl bg-black/30 p-3"><span className="text-zinc-500">Faltan</span><strong className="block text-white">{data?.referrals.referralsToMaxPower ?? 0}</strong></div>
          </div>
          <Link to="/referrals"><Button className="mt-5 w-full" variant="secondary"><Megaphone size={16} className="mr-2" />Ver red</Button></Link>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Retiros</h2>
              <p className="mt-2 text-sm text-zinc-400">Mínimo: {data?.withdrawals.minWithdrawalUSDT ?? 1} USDT. Solo un retiro pendiente y uno cada 24 horas.</p>
            </div>
            <Landmark className="text-aurum-gold" />
          </div>
          <div className="mt-5 rounded-2xl bg-black/30 p-4 text-sm text-zinc-300">
            {pendingWithdrawal ? (
              <span>Tienes un retiro pendiente por {formatUSDT(pendingWithdrawal.amount)}.</span>
            ) : data?.withdrawals.canRequestWithdrawal ? (
              <span>Puedes solicitar retiro ahora.</span>
            ) : (
              <span>Retiro no disponible ahora.</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={data?.withdrawals.canRequestWithdrawal ? "green" : "gold"}>{data?.withdrawals.canRequestWithdrawal ? "Disponible" : "En espera"}</Badge>
            {data?.withdrawals.hasPendingWithdrawal ? <Badge tone="gold">Pendiente</Badge> : null}
          </div>
          <Link to="/withdrawals"><Button className="mt-5 w-full">Gestionar retiros</Button></Link>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Producción activa</h2>
            <p className="mt-1 text-sm text-zinc-400">Tus máquinas activas y su progreso de pago.</p>
          </div>
          <Link to="/my-machines" className="text-sm font-bold text-aurum-gold">Ver todas</Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {activeMachines.slice(0, 4).map((machine) => (
            <div key={machine.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <strong>{machine.name || machine.machineName || machine.machineType}</strong>
                  <p className="mt-1 text-sm text-zinc-500">Ciclo: {formatUSDT(machine.effectiveCycleRewardAmount)}</p>
                </div>
                <Badge tone="green">ACTIVE</Badge>
              </div>
              <div className="mt-3"><ProgressBar value={machine.paidAmount} max={machine.maxPayoutAmount} /></div>
            </div>
          ))}
          {activeMachines.length === 0 ? <p className="text-sm text-zinc-500">Todavía no tienes máquinas activas.</p> : null}
        </div>
      </Card>
    </div>
  );
}
