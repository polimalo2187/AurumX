import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Clock, Filter, Landmark, WalletCards } from "lucide-react";
import { walletApi, type WalletTransactionDTO } from "@/api/wallet.api";
import { withdrawalsApi } from "@/api/withdrawals.api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";

type TransactionFilter = "ALL" | "REWARDS" | "WITHDRAWALS" | "ADJUSTMENTS";

const filters: { value: TransactionFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "REWARDS", label: "Recompensas" },
  { value: "WITHDRAWALS", label: "Retiros" },
  { value: "ADJUSTMENTS", label: "Ajustes" }
];

function transactionLabel(type: string) {
  const labels: Record<string, string> = {
    MACHINE_REWARD: "Recompensa de máquina",
    FREE_MACHINE_REWARD: "Recompensa Pico Inicial",
    REWARD_MACHINE_REWARD: "Recompensa Aurora",
    WITHDRAWAL_LOCK: "Retiro bloqueado",
    WITHDRAWAL_APPROVED: "Retiro aprobado",
    WITHDRAWAL_REJECTED: "Retiro devuelto",
    ADMIN_ADJUSTMENT: "Ajuste administrativo"
  };
  return labels[type] || type;
}

function transactionCategory(type: string): TransactionFilter {
  if (type.includes("REWARD")) return "REWARDS";
  if (type.includes("WITHDRAWAL")) return "WITHDRAWALS";
  if (type.includes("ADJUSTMENT")) return "ADJUSTMENTS";
  return "ALL";
}

function statusTone(status: string): "gold" | "green" | "red" | "muted" {
  if (status === "COMPLETED") return "green";
  if (status === "FAILED" || status === "CANCELLED") return "red";
  if (status === "PENDING") return "gold";
  return "muted";
}

export function WalletPage() {
  const [filter, setFilter] = useState<TransactionFilter>("ALL");
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: walletApi.me });
  const transactions = useQuery({ queryKey: ["wallet-transactions"], queryFn: walletApi.transactions });
  const withdrawals = useQuery({ queryKey: ["withdrawals"], queryFn: withdrawalsApi.myWithdrawals });

  const items = transactions.data?.items || [];
  const filteredItems = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((tx) => transactionCategory(tx.type) === filter);
  }, [filter, items]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, tx) => {
        if (tx.direction === "CREDIT") acc.credits += tx.amount;
        if (tx.direction === "DEBIT") acc.debits += tx.amount;
        if (tx.type.includes("REWARD")) acc.rewards += tx.amount;
        return acc;
      },
      { credits: 0, debits: 0, rewards: 0 }
    );
  }, [items]);

  const pendingWithdrawal = (withdrawals.data?.items || []).find((item) => item.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Wallet interna</p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">Saldo y movimientos</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">Controla recompensas, bloqueos, retiros y todos los movimientos internos en USDT.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/machines"><Button variant="secondary">Activar máquina</Button></Link>
          <Link to="/withdrawals"><Button>Retirar</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Disponible" value={formatUSDT(wallet.data?.availableUSDT)} icon={<WalletCards />} hint="Saldo retirable" />
        <StatCard label="Bloqueado" value={formatUSDT(wallet.data?.lockedUSDT)} icon={<Landmark />} hint="Retiros pendientes" />
        <StatCard label="Total producido" value={formatUSDT(totals.rewards)} icon={<ArrowDownToLine />} hint="Recompensas acumuladas" />
        <StatCard label="Débitos históricos" value={formatUSDT(totals.debits)} icon={<ArrowUpFromLine />} hint="Retiros y bloqueos" />
      </div>

      {pendingWithdrawal ? (
        <Card className="border-aurum-gold/20 bg-aurum-gold/10">
          <div className="flex items-start gap-3">
            <Clock className="mt-1 text-aurum-gold" />
            <div>
              <h2 className="font-black text-aurum-gold">Tienes un retiro pendiente</h2>
              <p className="mt-1 text-sm text-zinc-300">Monto bloqueado: {formatUSDT(pendingWithdrawal.amount)}. El admin debe procesarlo y agregar el hash de salida.</p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-black">Historial de wallet</h2>
            <p className="mt-1 text-sm text-zinc-400">Cada crédito o débito queda registrado con fecha, estado y balance.</p>
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
          {filteredItems.map((tx: WalletTransactionDTO) => (
            <div key={tx.id || tx._id || `${tx.type}-${tx.createdAt}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tx.direction === "CREDIT" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                    {tx.direction === "CREDIT" ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
                  </div>
                  <div>
                    <strong className="text-white">{transactionLabel(tx.type)}</strong>
                    <p className="mt-1 text-sm text-zinc-500">{formatDateTime(tx.createdAt)}</p>
                    {typeof tx.balanceAfter === "number" ? <p className="mt-1 text-xs text-zinc-500">Balance posterior: {formatUSDT(tx.balanceAfter)}</p> : null}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className={tx.direction === "CREDIT" ? "font-black text-emerald-300" : "font-black text-red-300"}>
                    {tx.direction === "CREDIT" ? "+" : "-"}{formatUSDT(tx.amount)}
                  </div>
                  <div className="mt-2"><Badge tone={statusTone(tx.status)}>{tx.status}</Badge></div>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-zinc-500">
              <Filter className="mx-auto mb-3 text-zinc-600" />
              No hay movimientos para este filtro.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
