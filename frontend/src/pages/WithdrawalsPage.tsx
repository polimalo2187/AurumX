import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Copy, ExternalLink, Landmark, ShieldAlert, WalletCards } from "lucide-react";
import { withdrawalsApi, type WithdrawalDTO } from "@/api/withdrawals.api";
import { walletApi } from "@/api/wallet.api";
import { usersApi } from "@/api/users.api";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";
import { isValidBscAddress } from "@/utils/validateBscAddress";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    CANCELLED: "Cancelado"
  };
  return labels[status] || status;
}

function statusTone(status: string): "gold" | "green" | "red" | "muted" {
  if (status === "APPROVED") return "green";
  if (status === "REJECTED" || status === "CANCELLED") return "red";
  if (status === "PENDING") return "gold";
  return "muted";
}

function bscScanTxUrl(hash?: string | null) {
  return hash ? `https://bscscan.com/tx/${hash}` : "";
}

export function WithdrawalsPage() {
  const queryClient = useQueryClient();
  const { copied, copy } = useCopyToClipboard();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const wallet = useQuery({ queryKey: ["wallet"], queryFn: walletApi.me });
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: usersApi.dashboard });
  const withdrawals = useQuery({ queryKey: ["withdrawals"], queryFn: withdrawalsApi.myWithdrawals });

  const request = useMutation({
    mutationFn: () => withdrawalsApi.request(Number(amount), address.trim()),
    onSuccess() {
      setAmount("");
      setAddress("");
      setConfirmed(false);
      void queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const withdrawalItems = withdrawals.data?.items || [];
  const pendingWithdrawal = withdrawalItems.find((item) => item.status === "PENDING");
  const amountNumber = Number(amount);
  const minWithdrawal = dashboard.data?.withdrawals.minWithdrawalUSDT ?? 1;
  const available = wallet.data?.availableUSDT ?? 0;
  const addressValid = isValidBscAddress(address.trim());
  const canRequest = Boolean(
    amountNumber >= minWithdrawal &&
    amountNumber <= available &&
    addressValid &&
    confirmed &&
    !pendingWithdrawal &&
    dashboard.data?.withdrawals.canRequestWithdrawal !== false
  );

  const totals = useMemo(() => {
    return withdrawalItems.reduce(
      (acc, item) => {
        if (item.status === "APPROVED") acc.approved += item.amount;
        if (item.status === "PENDING") acc.pending += item.amount;
        return acc;
      },
      { approved: 0, pending: 0 }
    );
  }, [withdrawalItems]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Retiros BSC / BEP20</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Solicitar retiro</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Los retiros se bloquean en tu wallet y el administrador los procesa manualmente agregando el hash de salida.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Disponible" value={formatUSDT(wallet.data?.availableUSDT)} icon={<WalletCards />} hint="Saldo retirable" />
        <StatCard label="Bloqueado" value={formatUSDT(wallet.data?.lockedUSDT)} icon={<Landmark />} hint="Fondos en revisión" />
        <StatCard label="Pendiente" value={formatUSDT(totals.pending)} icon={<Clock />} hint="Retiros esperando admin" />
        <StatCard label="Aprobado histórico" value={formatUSDT(totals.approved)} icon={<CheckCircle2 />} hint="Retiros procesados" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 text-aurum-gold" />
            <div>
              <h2 className="text-2xl font-black">Nueva solicitud</h2>
              <p className="mt-1 text-sm text-zinc-400">Mínimo {formatUSDT(minWithdrawal)}. Solo USDT por BSC/BEP20. Solo un retiro pendiente y uno cada 24 horas.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-bold text-zinc-300">Monto USDT</label>
              <input className="field mt-2" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej: 10" inputMode="decimal" />
              {amount && amountNumber < minWithdrawal ? <p className="mt-2 text-xs text-red-300">El mínimo es {formatUSDT(minWithdrawal)}.</p> : null}
              {amountNumber > available ? <p className="mt-2 text-xs text-red-300">El monto supera tu saldo disponible.</p> : null}
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-300">Wallet destino BSC / BEP20</label>
              <input className="field mt-2 font-mono text-sm" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." />
              {address && !addressValid ? <p className="mt-2 text-xs text-red-300">La wallet debe ser una dirección BSC válida.</p> : null}
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
              Confirmo que la wallet destino es correcta y pertenece a la red BSC/BEP20. Entiendo que enviar a una red incorrecta puede perder los fondos.
            </label>

            {pendingWithdrawal ? (
              <div className="rounded-2xl border border-aurum-gold/20 bg-aurum-gold/10 p-4 text-sm text-aurum-gold">Ya tienes un retiro pendiente. Debes esperar a que sea procesado.</div>
            ) : null}

            {dashboard.data?.withdrawals.canRequestWithdrawal === false && !pendingWithdrawal ? (
              <div className="rounded-2xl border border-aurum-gold/20 bg-aurum-gold/10 p-4 text-sm text-aurum-gold">
                Retiro no disponible ahora. {dashboard.data.withdrawals.nextWithdrawalAt ? `Próximo retiro: ${formatDateTime(dashboard.data.withdrawals.nextWithdrawalAt)}` : "Debes esperar el cooldown."}
              </div>
            ) : null}

            <Button className="w-full" onClick={() => request.mutate()} disabled={!canRequest || request.isPending}>Solicitar retiro</Button>

            {request.isSuccess ? <p className="text-sm text-emerald-300">Retiro solicitado correctamente. Fondos bloqueados hasta revisión.</p> : null}
            {request.error ? <p className="text-sm text-red-300">{getErrorMessage(request.error, "No se pudo solicitar el retiro.")}</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-2xl font-black">Historial de retiros</h2>
          <div className="space-y-3">
            {withdrawalItems.map((item: WithdrawalDTO) => (
              <div key={item.id || item._id || item.requestedAt} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{formatUSDT(item.amount)}</strong>
                      <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">Solicitado: {formatDateTime(item.requestedAt || item.createdAt || "")}</p>
                    <p className="mt-2 break-all font-mono text-xs text-zinc-400">Destino: {item.destinationAddress}</p>
                    {item.adminNote ? <p className="mt-2 text-sm text-zinc-400">Nota: {item.adminNote}</p> : null}
                    {item.adminTxHash ? <p className="mt-2 break-all font-mono text-xs text-emerald-300">TX salida: {item.adminTxHash}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => copy(item.destinationAddress)}><Copy size={15} /></Button>
                    {item.adminTxHash ? (
                      <a href={bscScanTxUrl(item.adminTxHash)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-aurum-gold hover:bg-white/15">
                        <ExternalLink size={15} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {withdrawalItems.length === 0 ? <p className="text-sm text-zinc-500">Todavía no tienes retiros.</p> : null}
            {copied ? <p className="text-sm text-aurum-gold">Copiado.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
