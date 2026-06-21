import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCcw, Search, XCircle } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";
import { idValue, itemsFromPage, numberValue, shortHash, statusTone, textValue, totalFromPage } from "@/utils/admin";

const statuses = ["", "PENDING_PAYMENT", "HASH_SUBMITTED", "VERIFYING", "NEEDS_REVIEW", "CONFIRMED", "REJECTED", "EXPIRED"];

function bscTx(hash?: string | null) {
  return hash ? `https://bscscan.com/tx/${hash}` : "";
}

export function AdminDepositsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");

  const deposits = useQuery({
    queryKey: ["admin-deposits", status, userId],
    queryFn: () => adminApi.deposits({ page: 1, limit: 50, status: status || undefined, userId: userId || undefined })
  });

  const retry = useMutation({
    mutationFn: (id: string) => adminApi.retryDeposit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-deposits"] })
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectDeposit(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-deposits"] })
  });

  const items = itemsFromPage(deposits.data);
  const total = totalFromPage(deposits.data);
  const reviewCount = items.filter((item) => item.status === "NEEDS_REVIEW").length;
  const pendingCount = items.filter((item) => ["PENDING_PAYMENT", "HASH_SUBMITTED", "VERIFYING"].includes(String(item.status))).length;
  const confirmedAmount = items.filter((item) => item.status === "CONFIRMED").reduce((sum, item) => sum + numberValue(item.confirmedAmountUSDT || item.expectedAmountUSDT), 0);

  if (deposits.isLoading) return <div className="screen-center">Cargando depósitos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Administración</p>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Depósitos</h1>
          <p className="mt-2 text-sm text-zinc-400">Revisa órdenes, hashes BEP20, reintentos de verificación y rechazos manuales.</p>
        </div>
        <Badge tone={reviewCount > 0 ? "gold" : "green"}>{reviewCount} en revisión</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Órdenes cargadas" value={String(total)} icon={<Search />} hint="Página actual" />
        <StatCard label="Pendientes" value={String(pendingCount)} icon={<AlertTriangle />} hint="Pago o verificación" />
        <StatCard label="Confirmado visible" value={formatUSDT(confirmedAmount)} icon={<CheckCircle2 />} hint="En la lista filtrada" />
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold outline-none">
            {statuses.map((item) => <option key={item} value={item}>{item || "Todos los estados"}</option>)}
          </select>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Filtrar por ID de usuario"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {items.map((deposit) => {
          const id = idValue(deposit);
          const tx = textValue(deposit.userSubmittedTxHash, "");
          const machine = textValue(deposit.machinePlanId, textValue(deposit.machineName, "Máquina"));
          const user = textValue(deposit.userId, "Usuario");
          return (
            <Card key={id || tx}>
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-xl text-white">{formatUSDT(numberValue(deposit.expectedAmountUSDT))}</strong>
                    <Badge tone={statusTone(String(deposit.status || ""))}>{textValue(deposit.status)}</Badge>
                    <Badge tone="muted">{textValue(deposit.network)} / {textValue(deposit.tokenStandard)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{machine} · {user}</p>
                  <p className="mt-1 text-xs text-zinc-500">Creado: {formatDateTime(String(deposit.createdAt || ""))}</p>
                  <p className="mt-1 text-xs text-zinc-500">Hash: {tx ? shortHash(tx) : "Sin hash"}</p>
                  {deposit.rejectionReason ? <p className="mt-2 text-sm text-red-300">Motivo: {textValue(deposit.rejectionReason)}</p> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {tx ? <a href={bscTx(tx)} target="_blank" rel="noreferrer"><Button variant="ghost"><ExternalLink size={16} className="mr-2" />BscScan</Button></a> : null}
                  {["HASH_SUBMITTED", "VERIFYING", "NEEDS_REVIEW"].includes(String(deposit.status)) ? (
                    <Button variant="secondary" onClick={() => retry.mutate(id)} disabled={retry.isPending}><RefreshCcw size={16} className="mr-2" />Reintentar</Button>
                  ) : null}
                  {!["CONFIRMED", "REJECTED", "EXPIRED"].includes(String(deposit.status)) ? (
                    <Button
                      variant="danger"
                      onClick={() => {
                        const reason = window.prompt("Motivo del rechazo");
                        if (reason) reject.mutate({ id, reason });
                      }}
                      disabled={reject.isPending}
                    >
                      <XCircle size={16} className="mr-2" />Rechazar
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}

        {items.length === 0 ? <Card><p className="text-sm text-zinc-400">No hay depósitos para estos filtros.</p></Card> : null}
      </div>
    </div>
  );
}
