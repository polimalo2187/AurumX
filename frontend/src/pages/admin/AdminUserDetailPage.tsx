import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, Factory, Landmark, ShieldAlert, WalletCards } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";
import { idValue, itemsFromPage, numberValue, statusTone, textValue } from "@/utils/admin";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function AdminUserDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const detail = useQuery({ queryKey: ["admin-user", id], queryFn: () => adminApi.user(id), enabled: Boolean(id) });

  const block = useMutation({
    mutationFn: () => adminApi.blockUser(id, window.prompt("Motivo del bloqueo") || "Bloqueo administrativo"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user", id] })
  });

  const unblock = useMutation({
    mutationFn: () => adminApi.unblockUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user", id] })
  });

  const data = detail.data || {};
  const user = asRecord(data.user);
  const wallet = asRecord(data.wallet);
  const machines = Array.isArray(data.machines) ? data.machines as Record<string, unknown>[] : [];
  const deposits = Array.isArray(data.deposits) ? data.deposits as Record<string, unknown>[] : [];
  const withdrawals = Array.isArray(data.withdrawals) ? data.withdrawals as Record<string, unknown>[] : [];
  const referrals = asRecord(data.referrals);
  const referredUsers = itemsFromPage(asRecord(referrals).referredUsers);

  const machineTotals = useMemo(() => {
    return machines.reduce(
      (acc: { paid: number; max: number; active: number }, machine: Record<string, unknown>) => {
        acc.paid += numberValue(machine.paidAmount);
        acc.max += numberValue(machine.maxPayoutAmount);
        if (machine.status === "ACTIVE") acc.active += 1;
        return acc;
      },
      { paid: 0, max: 0, active: 0 }
    );
  }, [machines]);

  if (detail.isLoading) return <div className="screen-center">Cargando usuario...</div>;

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-aurum-gold"><ArrowLeft size={16} /> Volver a usuarios</Link>

      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Detalle de usuario</p>
            <h1 className="mt-2 text-4xl font-black">{textValue(user.username, textValue(user.telegramUsername, "Usuario"))}</h1>
            <p className="mt-2 text-sm text-zinc-400">{textValue(user.phoneNumber)} · Ref: {textValue(user.referralCode)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={statusTone(String(user.status || ""))}>{textValue(user.status)}</Badge>
              {user.phoneVerified ? <Badge tone="green">Teléfono verificado</Badge> : <Badge tone="gold">Sin verificar</Badge>}
              {user.riskFlagged ? <Badge tone="red">Riesgo</Badge> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.status === "BLOCKED" ? (
              <Button onClick={() => unblock.mutate()} disabled={unblock.isPending}><CheckCircle2 size={16} className="mr-2" />Desbloquear</Button>
            ) : (
              <Button variant="danger" onClick={() => block.mutate()} disabled={block.isPending}><Ban size={16} className="mr-2" />Bloquear</Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Disponible" value={formatUSDT(numberValue(wallet.availableUSDT))} icon={<WalletCards />} hint={`${formatUSDT(numberValue(wallet.lockedUSDT))} bloqueado`} />
        <StatCard label="Máquinas activas" value={String(machineTotals.active)} icon={<Factory />} hint={`${machines.length} históricas`} />
        <StatCard label="Producido" value={formatUSDT(machineTotals.paid)} icon={<ShieldAlert />} hint={`Máximo ${formatUSDT(machineTotals.max)}`} />
        <StatCard label="Retiros" value={String(withdrawals.length)} icon={<Landmark />} hint={`${deposits.length} depósitos`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-black">Máquinas</h2>
          <div className="mt-4 space-y-3">
            {machines.slice(0, 6).map((machine) => (
              <MiniRow key={idValue(machine) || textValue(machine.activatedAt)} title={textValue(machine.name, textValue(machine.machineType, "Máquina"))} subtitle={`${formatUSDT(numberValue(machine.paidAmount))} / ${formatUSDT(numberValue(machine.maxPayoutAmount))}`} status={String(machine.status || "")} />
            ))}
            {machines.length === 0 ? <Empty text="Sin máquinas." /> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Depósitos</h2>
          <div className="mt-4 space-y-3">
            {deposits.slice(0, 6).map((deposit) => (
              <MiniRow key={idValue(deposit)} title={formatUSDT(numberValue(deposit.expectedAmountUSDT))} subtitle={`${textValue(deposit.userSubmittedTxHash)} · ${formatDateTime(String(deposit.createdAt || ""))}`} status={String(deposit.status || "")} />
            ))}
            {deposits.length === 0 ? <Empty text="Sin depósitos." /> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Retiros</h2>
          <div className="mt-4 space-y-3">
            {withdrawals.slice(0, 6).map((withdrawal) => (
              <MiniRow key={idValue(withdrawal)} title={formatUSDT(numberValue(withdrawal.amount))} subtitle={textValue(withdrawal.destinationAddress)} status={String(withdrawal.status || "")} />
            ))}
            {withdrawals.length === 0 ? <Empty text="Sin retiros." /> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Referidos</h2>
          <div className="mt-4 space-y-3">
            {referredUsers.slice(0, 6).map((ref) => (
              <MiniRow key={idValue(ref)} title={textValue(ref.telegramUsername, textValue(ref.phoneNumber, "Referido"))} subtitle={formatDateTime(String(ref.createdAt || ""))} status={ref.phoneVerified ? "VERIFIED" : "PENDING"} />
            ))}
            {referredUsers.length === 0 ? <Empty text="Sin referidos directos." /> : null}
          </div>
        </Card>
      </div>

      {detail.error ? <Card className="border-red-400/20 bg-red-500/10"><p className="text-sm text-red-300"><AlertTriangle className="mr-2 inline" size={16} />No se pudo cargar el detalle.</p></Card> : null}
    </div>
  );
}

function MiniRow({ title, subtitle, status }: { title: string; subtitle: string; status: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-white">{title}</strong>
          <p className="mt-1 truncate text-xs text-zinc-500">{subtitle}</p>
        </div>
        <Badge tone={statusTone(status)}>{status || "—"}</Badge>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-black/30 p-4 text-sm text-zinc-500">{text}</p>;
}
