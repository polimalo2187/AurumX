import { Card } from "@/components/ui/Card";

export function AdminUserDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Administración</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Detalle de usuario</h1>
      </div>
      <Card>
        <p className="text-zinc-400">Wallet, máquinas, depósitos, retiros, referidos y riesgo.</p>
        <p className="mt-4 text-sm text-zinc-500">Esta pantalla queda preparada para conectar tablas y acciones admin en la siguiente iteración del frontend.</p>
      </Card>
    </div>
  );
}
