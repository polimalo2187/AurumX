import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, ExternalLink, Landmark, XCircle } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";
import { idValue, itemsFromPage, numberValue, shortHash, statusTone, textValue, totalFromPage } from "@/utils/admin";

function bscAddress(address?: string) {
  return address ? `https://bscscan.com/address/${address}` : "";
}

export function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const withdrawals = useQuery({ queryKey: ["admin-withdrawals"], queryFn: () => adminApi.withdrawals({ page: 1, limit: 50 }) });

  const approve = useMutation({
    mutationFn: ({ id, txHash, note }: { id: string; txHash: string; note?: string }) => adminApi.approveWithdrawal(id, txHash, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] })
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminApi.rejectWithdrawal(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] })
  });

  const items = itemsFromPage(withdrawals.data);
  const total = totalFromPage(withdrawals.data);
  const amount = items.reduce((sum, item) => sum + numberValue(item.amount), 0);

  if (withdrawals.isLoading) return <div className="screen-center">Cargando retiros...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Administración</p>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Retiros pendientes</h1>
          <p className="mt-2 text-sm text-zinc-400">Aprueba manualmente con hash BEP20 o rechaza con nota administrativa.</p>
        </div>
        <Badge tone={total > 0 ? "gold" : "green"}>{total} pendientes</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Solicitudes" value={String(total)} icon={<Landmark />} hint="Pendientes de revisión" />
        <StatCard label="Monto total" value={formatUSDT(amount)} icon={<ClipboardCheck />} hint="USDT por procesar" />
        <StatCard label="Promedio" value={formatUSDT(total ? amount / total : 0)} icon={<CheckCircle2 />} hint="Por solicitud" />
      </div>

      <div className="space-y-3">
        {items.map((withdrawal) => {
          const id = idValue(withdrawal);
          const address = textValue(withdrawal.destinationAddress, "");
          const user = textValue(withdrawal.userId, "Usuario");

          return (
            <Card key={id}>
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-xl text-white">{formatUSDT(numberValue(withdrawal.amount))}</strong>
                    <Badge tone={statusTone(String(withdrawal.status || ""))}>{textValue(withdrawal.status)}</Badge>
                    <Badge tone="muted">{textValue(withdrawal.network)} / {textValue(withdrawal.tokenStandard)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{user}</p>
                  <p className="mt-1 break-all text-xs text-zinc-500">Destino: {address}</p>
                  <p className="mt-1 text-xs text-zinc-500">Solicitado: {formatDateTime(String(withdrawal.requestedAt || withdrawal.createdAt || ""))}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {address ? <a href={bscAddress(address)} target="_blank" rel="noreferrer"><Button variant="ghost"><ExternalLink size={16} className="mr-2" />Wallet</Button></a> : null}
                  <Button
                    onClick={() => {
                      const txHash = window.prompt("Hash BEP20 de pago");
                      if (!txHash) return;
                      const note = window.prompt("Nota administrativa opcional") || undefined;
                      approve.mutate({ id, txHash, note });
                    }}
                    disabled={approve.isPending}
                  >
                    <CheckCircle2 size={16} className="mr-2" />Aprobar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      const note = window.prompt("Motivo del rechazo");
                      if (note) reject.mutate({ id, note });
                    }}
                    disabled={reject.isPending}
                  >
                    <XCircle size={16} className="mr-2" />Rechazar
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {items.length === 0 ? (
          <Card><p className="text-sm text-zinc-400">No hay retiros pendientes ahora.</p></Card>
        ) : null}
      </div>
    </div>
  );
}
