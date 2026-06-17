import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/api/wallet.api";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";

export function WalletPage() {
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: walletApi.me });
  const transactions = useQuery({ queryKey: ["wallet-transactions"], queryFn: walletApi.transactions });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Wallet interna</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Saldo y transacciones</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Disponible" value={formatUSDT(wallet.data?.availableUSDT)} />
        <StatCard label="Bloqueado" value={formatUSDT(wallet.data?.lockedUSDT)} />
      </div>
      <Card>
        <h2 className="mb-4 text-xl font-black">Últimas transacciones</h2>
        <div className="space-y-3">
          {(transactions.data?.items || []).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-black/30 p-4">
              <div>
                <strong className="text-white">{tx.type}</strong>
                <p className="text-sm text-zinc-500">{formatDateTime(tx.createdAt)}</p>
              </div>
              <span className={tx.direction === "CREDIT" ? "text-emerald-300" : "text-red-300"}>{tx.direction === "CREDIT" ? "+" : "-"}{formatUSDT(tx.amount)}</span>
            </div>
          ))}
          {transactions.data?.items?.length === 0 ? <p className="text-zinc-500">Sin transacciones todavía.</p> : null}
        </div>
      </Card>
    </div>
  );
}
