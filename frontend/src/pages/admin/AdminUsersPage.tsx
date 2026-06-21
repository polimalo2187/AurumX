import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, Search, ShieldCheck, Users } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime } from "@/utils/formatDate";
import { idValue, itemsFromPage, statusTone, textValue, totalFromPage } from "@/utils/admin";

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);

  const users = useQuery({
    queryKey: ["admin-users", search, status, riskOnly],
    queryFn: () => adminApi.users({
      page: 1,
      limit: 50,
      search: search || undefined,
      status: status || undefined,
      riskFlagged: riskOnly ? true : undefined
    })
  });

  const items = itemsFromPage(users.data);
  const total = totalFromPage(users.data);
  const riskCount = items.filter((item) => Boolean(item.riskFlagged)).length;
  const blockedCount = items.filter((item) => item.status === "BLOCKED").length;

  if (users.isLoading) return <div className="screen-center">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Administración</p>
          <h1 className="mt-2 text-4xl font-black md:text-6xl">Usuarios</h1>
          <p className="mt-2 text-sm text-zinc-400">Busca, revisa estado, riesgo, teléfonos y detalle operativo.</p>
        </div>
        <Badge tone="gold">{total} resultados</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Usuarios cargados" value={String(items.length)} icon={<Users />} hint="Página actual" />
        <StatCard label="Marcados por riesgo" value={String(riskCount)} icon={<AlertTriangle />} hint="Revisión recomendada" />
        <StatCard label="Bloqueados" value={String(blockedCount)} icon={<ShieldCheck />} hint="Acceso detenido" />
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <Search size={18} className="text-aurum-gold" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuario, teléfono, Telegram o referido"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold outline-none">
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="BLOCKED">Bloqueados</option>
          </select>
          <button
            type="button"
            onClick={() => setRiskOnly((value) => !value)}
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${riskOnly ? "border-aurum-gold bg-aurum-gold text-black" : "border-white/10 bg-white/5 text-zinc-300"}`}
          >
            Solo riesgo
          </button>
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          {items.map((user) => {
            const id = idValue(user);
            return (
              <div key={id || textValue(user.phoneNumber)} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-lg text-white">{textValue(user.username) !== "—" ? textValue(user.username) : textValue(user.telegramUsername, "Usuario")}</strong>
                      <Badge tone={statusTone(String(user.status || ""))}>{textValue(user.status)}</Badge>
                      {user.riskFlagged ? <Badge tone="red">Riesgo</Badge> : null}
                      {user.phoneVerified ? <Badge tone="green">Verificado</Badge> : <Badge tone="gold">Sin verificar</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{textValue(user.phoneNumber)} · Ref: {textValue(user.referralCode)}</p>
                    <p className="mt-1 text-xs text-zinc-500">Registro: {formatDateTime(String(user.createdAt || ""))}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/users/${id}`}><Button variant="secondary">Ver detalle</Button></Link>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 ? <p className="rounded-2xl bg-black/30 p-6 text-center text-sm text-zinc-400">No hay usuarios para estos filtros.</p> : null}
        </div>
      </Card>
    </div>
  );
}
