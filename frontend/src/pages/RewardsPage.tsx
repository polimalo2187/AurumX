import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Factory, Gem, ListFilter, TrendingUp, WalletCards, Zap } from "lucide-react";
import { machinesApi } from "@/api/machines.api";
import { walletApi, type WalletTransactionDTO } from "@/api/wallet.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";

type RewardFilter = "ALL" | "MACHINE_REWARD" | "FREE_MACHINE_REWARD" | "REWARD_MACHINE_REWARD";

const filters: { value: RewardFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "MACHINE_REWARD", label: "Pagadas" },
  { value: "FREE_MACHINE_REWARD", label: "Pico Inicial" },
  { value: "REWARD_MACHINE_REWARD", label: "Aurora" }
];

function rewardLabel(type: string) {
  const labels: Record<string, string> = {
    MACHINE_REWARD: "Recompensa de máquina pagada",
    FREE_MACHINE_REWARD: "Recompensa Pico Inicial",
    REWARD_MACHINE_REWARD: "Recompensa Aurora"
  };

  return labels[type] || type;
}

function rewardTone(type: string): "gold" | "green" | "red" | "muted" {
  if (type === "REWARD_MACHINE_REWARD") return "green";
  if (type === "FREE_MACHINE_REWARD") return "muted";
  if (type === "MACHINE_REWARD") return "gold";
  return "muted";
}

export function RewardsPage() {
  const [filter, setFilter] = useState<RewardFilter>("ALL");
  const transactions = useQuery({ queryKey: ["wallet-transactions"], queryFn: walletApi.transactions });
  const machines = useQuery({ queryKey: ["my-machines"], queryFn: machinesApi.myMachines });

  const rewardItems = useMemo(() => {
    const items = transactions.data?.items || [];
    return items
      .filter((tx) => tx.direction === "CREDIT" && tx.type.includes("REWARD"))
      .filter((tx) => filter === "ALL" || tx.type === filter);
  }, [filter, transactions.data?.items]);

  const totals = useMemo(() => {
    const allRewards = (transactions.data?.items || []).filter((tx) => tx.direction === "CREDIT" && tx.type.includes("REWARD"));
    const activeMachines = (machines.data || []).filter((machine) => machine.status === "ACTIVE");
    return {
      totalRewards: allRewards.reduce((sum, tx) => sum + tx.amount, 0),
      totalCount: allRewards.length,
      todayRewards: allRewards
        .filter((tx) => new Date(tx.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, tx) => sum + tx.amount, 0),
      dailyProjection: activeMachines.reduce((sum, machine) => sum + (machine.effectiveCycleRewardAmount || 0), 0)
    };
  }, [transactions.data?.items, machines.data]);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-aurum-gold/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Recompensas</p>
            <h1 className="mt-2 text-4xl font-black md:text-6xl">Historial de producción</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Revisa cada pago generado por tus máquinas y la proyección diaria de tu flota activa.
            </p>
          </div>
          <Link to="/wallet"><Button variant="secondary"><WalletCards size={16} className="mr-2" />Ver wallet</Button></Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Producido total" value={formatUSDT(totals.totalRewards)} icon={<Gem />} hint="Créditos por recompensas" />
        <StatCard label="Pagos recibidos" value={String(totals.totalCount)} icon={<ListFilter />} hint="Eventos históricos" />
        <StatCard label="Producido hoy" value={formatUSDT(totals.todayRewards)} icon={<Clock />} hint="Según fecha local" />
        <StatCard label="Proyección diaria" value={formatUSDT(totals.dailyProjection)} icon={<TrendingUp />} hint="Máquinas activas" />
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-black">Pagos de producción</h2>
            <p className="mt-1 text-sm text-zinc-400">Filtra por origen de recompensa.</p>
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

        <div className="mt-5 space-y-3">
          {rewardItems.map((tx: WalletTransactionDTO) => (
            <div key={tx.id || tx._id || `${tx.type}-${tx.createdAt}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-aurum-gold/10 p-3 text-aurum-gold"><Zap size={18} /></div>
                  <div>
                    <strong className="text-white">{rewardLabel(tx.type)}</strong>
                    <p className="mt-1 text-sm text-zinc-500">{formatDateTime(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <strong className="text-xl text-emerald-300">+{formatUSDT(tx.amount)}</strong>
                  <div className="mt-2 flex justify-start md:justify-end">
                    <Badge tone={rewardTone(tx.type)}>{tx.status}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {rewardItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
              <Factory className="mx-auto text-aurum-gold" size={34} />
              <h3 className="mt-3 text-xl font-black">Sin recompensas todavía</h3>
              <p className="mt-2 text-sm text-zinc-400">Activa una máquina y espera el primer ciclo de producción.</p>
              <Link to="/machines"><Button className="mt-5">Ver máquinas</Button></Link>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
