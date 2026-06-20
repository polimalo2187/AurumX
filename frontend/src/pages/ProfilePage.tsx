import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, UserRound, Copy, LogOut, Phone, BadgeCheck, KeyRound } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-aurum-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-aurum-gold text-2xl font-black text-black shadow-aurum">
              {(user?.telegramUsername || user?.phoneNumber || "A").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Cuenta verificada</p>
              <h1 className="mt-1 text-3xl font-black md:text-5xl">Perfil AurumX</h1>
              <p className="mt-2 text-sm text-zinc-400">Tu identidad está vinculada a Telegram y teléfono.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={user?.status === "ACTIVE" ? "green" : "red"}>{user?.status === "ACTIVE" ? "Activo" : "Bloqueado"}</Badge>
            {isAdmin ? <Badge tone="gold">Administrador</Badge> : <Badge>Usuario</Badge>}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-black"><UserRound className="text-aurum-gold" /> Datos de cuenta</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Info label="Usuario Telegram" value={user?.telegramUsername || "No disponible"} icon={<BadgeCheck size={18} />} />
            <Info label="Teléfono verificado" value={user?.phoneNumber || "No disponible"} icon={<Phone size={18} />} />
            <Info label="Estado" value={user?.status || "—"} icon={<ShieldCheck size={18} />} />
            <Info label="Rol" value={isAdmin ? "Administrador" : "Usuario"} icon={<KeyRound size={18} />} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Código de referido</h2>
          <p className="mt-2 text-sm text-zinc-400">Compártelo para aumentar tu potencia de producción.</p>
          <div className="mt-4 rounded-2xl bg-black/40 p-4 font-mono text-lg font-black text-aurum-gold">{user?.referralCode || "—"}</div>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => copy(user?.referralCode || "")} disabled={!user?.referralCode}>
            <Copy size={16} className="mr-2" /> {copied ? "Copiado" : "Copiar código"}
          </Button>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Sesión</h2>
            <p className="mt-1 text-sm text-zinc-400">Puedes cerrar sesión de este dispositivo cuando quieras.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/referrals"><Button variant="secondary">Ver referidos</Button></Link>
            <Button variant="danger" onClick={logout}><LogOut size={16} className="mr-2" /> Cerrar sesión</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl bg-black/30 p-4">
      <div className="flex items-center gap-2 text-sm text-zinc-500">{icon}<span>{label}</span></div>
      <strong className="mt-2 block break-all text-white">{value}</strong>
    </div>
  );
}
