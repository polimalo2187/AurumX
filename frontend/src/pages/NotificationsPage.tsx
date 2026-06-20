import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCircle2, Clock, Filter, Inbox, RefreshCw, XCircle } from "lucide-react";
import { notificationsApi, type NotificationDTO } from "@/api/notifications.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/utils/formatDate";

type NotificationFilter = "ALL" | "PENDING" | "SENT" | "FAILED";

const filters: Array<{ key: NotificationFilter; label: string }> = [
  { key: "ALL", label: "Todas" },
  { key: "PENDING", label: "Pendientes" },
  { key: "SENT", label: "Enviadas" },
  { key: "FAILED", label: "Fallidas" }
];

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const query = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list, refetchInterval: 30000 });

  const notifications = query.data || [];
  const filtered = useMemo(() => {
    if (filter === "ALL") return notifications;
    return notifications.filter((item) => item.status === filter);
  }, [filter, notifications]);

  const counts = useMemo(() => ({
    all: notifications.length,
    pending: notifications.filter((item) => item.status === "PENDING").length,
    sent: notifications.filter((item) => item.status === "SENT").length,
    failed: notifications.filter((item) => item.status === "FAILED").length
  }), [notifications]);

  if (query.isLoading) return <div className="screen-center">Cargando notificaciones...</div>;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-aurum-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Centro de alertas</p>
            <h1 className="mt-2 text-4xl font-black md:text-6xl">Notificaciones</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">Depósitos, retiros, recompensas, referidos y alertas importantes de tu cuenta.</p>
          </div>
          <Button variant="secondary" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw size={16} className="mr-2" /> {query.isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Total" value={counts.all} icon={<Bell />} />
        <MiniStat label="Pendientes" value={counts.pending} icon={<Clock />} />
        <MiniStat label="Enviadas" value={counts.sent} icon={<CheckCircle2 />} />
        <MiniStat label="Fallidas" value={counts.failed} icon={<XCircle />} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 flex items-center gap-2 text-sm font-bold text-zinc-400"><Filter size={16} /> Filtros</div>
          {filters.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${filter === item.key ? "bg-aurum-gold text-black" : "bg-white/5 text-zinc-300 hover:bg-white/10"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((item) => <NotificationCard key={item.id} item={item} />)}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-white/5 text-zinc-400"><Inbox /></div>
          <h2 className="mt-4 text-xl font-black">No hay notificaciones aquí</h2>
          <p className="mt-2 text-sm text-zinc-400">Cuando ocurra algo importante en tu cuenta, aparecerá en esta sección.</p>
        </Card>
      ) : null}

      {query.isError ? <p className="text-sm text-red-300">No se pudieron cargar las notificaciones.</p> : null}
    </div>
  );
}

function NotificationCard({ item }: { item: NotificationDTO }) {
  const tone = item.status === "SENT" ? "green" : item.status === "FAILED" ? "red" : "gold";
  const Icon = item.status === "SENT" ? CheckCircle2 : item.status === "FAILED" ? AlertTriangle : Clock;

  return (
    <Card>
      <div className="flex gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-aurum-gold/10 text-aurum-gold"><Icon size={20} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-white">{item.title}</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{item.message}</p>
            </div>
            <Badge tone={tone}>{translateStatus(item.status)}</Badge>
          </div>
          <p className="mt-3 text-xs text-zinc-500">{formatDateTime(item.createdAt)}</p>
        </div>
      </div>
    </Card>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-aurum-gold/10 text-aurum-gold">{icon}</div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Alertas</span>
      </div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <strong className="text-3xl text-white">{value}</strong>
    </Card>
  );
}

function translateStatus(status: NotificationDTO["status"]) {
  if (status === "SENT") return "Enviada";
  if (status === "FAILED") return "Fallida";
  return "Pendiente";
}
