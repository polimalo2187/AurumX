import { Card } from "@/components/ui/Card";

export function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Administración</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Usuarios</h1>
      </div>
      <Card>
        <p className="text-zinc-400">Listado, búsqueda, bloqueo y detalle operativo de usuarios.</p>
        <p className="mt-4 text-sm text-zinc-500">Esta pantalla queda preparada para conectar tablas y acciones admin en la siguiente iteración del frontend.</p>
      </Card>
    </div>
  );
}
