import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { idValue, itemsFromPage, numberValue, statusTone, textValue } from "@/utils/admin";

function countFromAgg(value: unknown, key: string): number {
  if (!Array.isArray(value)) return 0;
  const item = value.find((entry) => entry && typeof entry === "object" && String((entry as Record<string, unknown>)._id) === key);
  const count = item && typeof item === "object" ? (item as Record<string, unknown>).count : 0;
  return typeof count === "number" ? count : 0;
}

export function AdminRiskPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("OPEN");
  const [severity, setSeverity] = useState("");

  const summary = useQuery({ queryKey: ["admin-risk-summary"], queryFn: adminApi.riskSummary });
  const flags = useQuery({
    queryKey: ["admin-risk-flags", status, severity],
    queryFn: () => adminApi.riskFlags({ page: 1, limit: 50, status: status || undefined, severity: severity || undefined })
  });

  const resolve = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminApi.resolveRiskFlag(id, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-risk-flags"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-risk-summary"] });
    }
  });

  const ignore = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminApi.ignoreRiskFlag(id, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-risk-flags"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-risk-summary"] });
    }
  });

  const items = itemsFromPage(flags.data);
  const openFlags = numberValue(summary.data?.openFlags);
  const highRiskUsers = numberValue(summary.data?.highRiskUsers);
  const criticalFlags = countFromAgg(summary.data?.flagsBySeverity, "CRITICAL");
  const highFlags = countFromAgg(summary.data?.flagsBySeverity, "HIGH");

  if (flags.isLoading || summary.isLoading) return <div className="screen-center">Cargando riesgo...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Administración</p>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Riesgo</h1>
          <p className="mt-2 text-sm text-zinc-400">Alertas antifraude, señales de abuso y resolución administrativa.</p>
        </div>
        <Badge tone={openFlags > 0 ? "gold" : "green"}>{openFlags} abiertas</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Abiertas" value={String(openFlags)} icon={<ShieldAlert />} hint="Pendientes de decisión" />
        <StatCard label="Críticas" value={String(criticalFlags)} icon={<AlertTriangle />} hint="Prioridad máxima" />
        <StatCard label="Altas" value={String(highFlags)} icon={<ShieldCheck />} hint="Revisión urgente" />
        <StatCard label="Usuarios marcados" value={String(highRiskUsers)} icon={<CheckCircle2 />} hint="Con riesgo activo" />
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold outline-none">
            <option value="">Todos los estados</option>
            <option value="OPEN">Abiertas</option>
            <option value="RESOLVED">Resueltas</option>
            <option value="IGNORED">Ignoradas</option>
          </select>
          <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold outline-none">
            <option value="">Todas las severidades</option>
            <option value="CRITICAL">Crítica</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {items.map((flag) => {
          const id = idValue(flag);
          return (
            <Card key={id}>
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-xl text-white">{textValue(flag.type, "Alerta")}</strong>
                    <Badge tone={statusTone(String(flag.severity || ""))}>{textValue(flag.severity)}</Badge>
                    <Badge tone={statusTone(String(flag.status || ""))}>{textValue(flag.status)}</Badge>
                    <Badge tone="muted">Score {textValue(flag.score)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{textValue(flag.reason)}</p>
                  <p className="mt-1 text-xs text-zinc-500">Usuario: {textValue(flag.userId)} · {formatDateTime(String(flag.createdAt || ""))}</p>
                  {flag.resolutionNote ? <p className="mt-2 text-sm text-emerald-300">Resolución: {textValue(flag.resolutionNote)}</p> : null}
                </div>

                {flag.status === "OPEN" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        const note = window.prompt("Nota de resolución");
                        if (note) resolve.mutate({ id, note });
                      }}
                      disabled={resolve.isPending}
                    >
                      <CheckCircle2 size={16} className="mr-2" />Resolver
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const note = window.prompt("Motivo para ignorar");
                        if (note) ignore.mutate({ id, note });
                      }}
                      disabled={ignore.isPending}
                    >
                      <XCircle size={16} className="mr-2" />Ignorar
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}

        {items.length === 0 ? <Card><p className="text-sm text-zinc-400">No hay alertas para estos filtros.</p></Card> : null}
      </div>
    </div>
  );
}
