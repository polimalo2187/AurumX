import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileClock, Search } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { downloadJson, idValue, itemsFromPage, statusTone, textValue, totalFromPage } from "@/utils/admin";

export function AdminAuditPage() {
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");

  const logs = useQuery({
    queryKey: ["admin-audit", action, targetType],
    queryFn: () => adminApi.auditLogs({ page: 1, limit: 50, action: action || undefined, targetType: targetType || undefined })
  });

  const items = itemsFromPage(logs.data);
  const total = totalFromPage(logs.data);

  if (logs.isLoading) return <div className="screen-center">Cargando auditoría...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Administración</p>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Auditoría</h1>
          <p className="mt-2 text-sm text-zinc-400">Trazabilidad de acciones sensibles del sistema.</p>
        </div>
        <Button variant="secondary" onClick={() => downloadJson("aurumx-audit.json", items)}><Download size={16} className="mr-2" />Exportar JSON</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Eventos cargados" value={String(items.length)} icon={<FileClock />} hint={`${total} total según filtro`} />
        <StatCard label="Filtro activo" value={action || targetType ? "Sí" : "No"} icon={<Search />} hint="Acción / objetivo" />
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="Filtrar por acción"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
          />
          <input
            value={targetType}
            onChange={(event) => setTargetType(event.target.value)}
            placeholder="Filtrar por tipo de objetivo"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {items.map((log) => (
          <Card key={idValue(log) || `${textValue(log.action)}-${textValue(log.createdAt)}`}>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-white">{textValue(log.action)}</strong>
                  <Badge tone={statusTone(String(log.actorType || ""))}>{textValue(log.actorType)}</Badge>
                  <Badge tone="muted">{textValue(log.targetType)}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-400">Target: {textValue(log.targetId)} · Actor: {textValue(log.actorUserId)}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatDateTime(String(log.createdAt || ""))}</p>
              </div>
              <details className="max-w-xl rounded-2xl bg-black/30 p-3 text-xs text-zinc-400">
                <summary className="cursor-pointer font-bold text-aurum-gold">Ver metadata</summary>
                <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{JSON.stringify({ before: log.before, after: log.after, metadata: log.metadata }, null, 2)}</pre>
              </details>
            </div>
          </Card>
        ))}

        {items.length === 0 ? <Card><p className="text-sm text-zinc-400">No hay eventos para estos filtros.</p></Card> : null}
      </div>
    </div>
  );
}
