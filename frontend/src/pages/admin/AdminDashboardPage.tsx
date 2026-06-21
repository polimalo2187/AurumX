import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Factory, Landmark, ShieldAlert, Users, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "@/api/admin.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatUSDT } from "@/utils/formatMoney";
import { numberValue } from "@/utils/admin";

function group(data: Record<string, unknown> | undefined, key: string) {
  const value = data?.[key];
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function AdminDashboardPage() {
  const dashboard = useQuery({ queryKey: ["admin-dashboard"], queryFn: adminApi.dashboard });
  const data = dashboard.data || {};
  const users = group(data, "users");
  const machines = group(data, "machines");
  const deposits = group(data, "deposits");
  const withdrawals = group(data, "withdrawals");
  const wallets = group(data, "wallets");
  const risk = group(data, "risk");

  if (dashboard.isLoading) return <div className="screen-center">Cargando administración...</div>;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-aurum-gold/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Administración</p>
            <h1 className="mt-2 text-4xl font-black md:text-6xl">Centro de control</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Supervisa usuarios, depósitos, retiros, máquinas, wallets y alertas de riesgo desde una vista ejecutiva.
            </p>
          </div>
          <Badge tone={numberValue(risk.highRiskFlags) > 0 ? "red" : "green"}>
            {numberValue(risk.highRiskFlags) > 0 ? "Riesgo alto activo" : "Riesgo controlado"}
          </Badge>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios totales" value={String(numberValue(users.total))} icon={<Users />} hint={`${numberValue(users.active)} activos`} />
        <StatCard label="Máquinas activas" value={String(numberValue(machines.active))} icon={<Factory />} hint={`${numberValue(machines.completed)} completadas`} />
        <StatCard label="Wallets disponibles" value={formatUSDT(numberValue(wallets.availableUSDT))} icon={<WalletCards />} hint={`${formatUSDT(numberValue(wallets.lockedUSDT))} bloqueado`} />
        <StatCard label="Retiros pendientes" value={String(numberValue(withdrawals.pending))} icon={<Landmark />} hint={`${formatUSDT(numberValue(withdrawals.approvedAmountUSDT))} aprobado`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-xl font-black">Depósitos</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Pendientes" value={String(numberValue(deposits.pending))} />
            <Row label="En revisión" value={String(numberValue(deposits.needsReview))} />
            <Row label="Confirmados" value={String(numberValue(deposits.confirmed))} />
            <Row label="USDT confirmado" value={formatUSDT(numberValue(deposits.confirmedAmountUSDT))} />
          </div>
          <Link to="/admin/deposits"><Button className="mt-5 w-full" variant="secondary">Gestionar depósitos</Button></Link>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Producción</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Pagado a usuarios" value={formatUSDT(numberValue(machines.paidAmountUSDT))} />
            <Row label="Máximo programado" value={formatUSDT(numberValue(machines.maxPayoutAmountUSDT))} />
            <Row label="Máquinas activas" value={String(numberValue(machines.active))} />
            <Row label="Completadas" value={String(numberValue(machines.completed))} />
          </div>
          <Link to="/admin/users"><Button className="mt-5 w-full" variant="secondary">Ver usuarios</Button></Link>
        </Card>

        <Card className={numberValue(risk.openFlags) > 0 ? "border-aurum-gold/30" : ""}>
          <h2 className="flex items-center gap-2 text-xl font-black"><ShieldAlert className="text-aurum-gold" /> Riesgo</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Alertas abiertas" value={String(numberValue(risk.openFlags))} />
            <Row label="Alta prioridad" value={String(numberValue(risk.highRiskFlags))} />
            <Row label="Usuarios marcados" value={String(numberValue(risk.flaggedUsers))} />
          </div>
          {numberValue(risk.highRiskFlags) > 0 ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">
              <AlertTriangle size={18} /> Hay alertas que requieren revisión.
            </div>
          ) : null}
          <Link to="/admin/risk"><Button className="mt-5 w-full" variant="secondary">Revisar riesgo</Button></Link>
        </Card>
      </div>

      {dashboard.error ? <Card className="border-red-400/20 bg-red-500/10"><p className="text-sm text-red-300">No se pudo cargar el dashboard administrativo.</p></Card> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-2xl bg-black/30 p-3">
      <span className="text-zinc-500">{label}</span>
      <strong className="text-white">{value}</strong>
    </div>
  );
}
