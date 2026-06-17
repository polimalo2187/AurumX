import { Bell, LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/Button";

export function Header() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-aurum-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-aurum-gold font-black text-black shadow-aurum">A</div>
          <div>
            <strong className="block text-white">AurumX</strong>
            <span className="text-xs text-zinc-500">Mining Console</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link to="/admin/dashboard" className="hidden rounded-xl border border-aurum-gold/20 px-3 py-2 text-sm font-bold text-aurum-gold md:inline-flex">
              <Shield size={16} className="mr-2" /> Admin
            </Link>
          ) : null}
          <Link to="/notifications" className="rounded-xl border border-white/10 p-2 text-zinc-300 hover:text-aurum-gold">
            <Bell size={18} />
          </Link>
          <span className="hidden text-sm text-zinc-400 md:inline">{user?.telegramUsername || user?.phoneNumber || "Usuario"}</span>
          <Button variant="ghost" onClick={logout} aria-label="Cerrar sesión">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
