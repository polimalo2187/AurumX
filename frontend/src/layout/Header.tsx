import { Bell, LogOut, Shield, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications.api";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/Button";

export function Header() {
  const { user, isAdmin, logout } = useAuth();
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list, refetchInterval: 60000 });
  const pendingCount = (notifications.data || []).filter((item) => item.status === "PENDING").length;

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
            <Link to="/admin/dashboard" className="inline-flex rounded-xl border border-aurum-gold/20 px-3 py-2 text-sm font-bold text-aurum-gold">
              <Shield size={16} className="mr-2" /> Admin
            </Link>
          ) : null}

          <Link to="/notifications" className="relative rounded-xl border border-white/10 p-2 text-zinc-300 hover:text-aurum-gold">
            <Bell size={18} />
            {pendingCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-aurum-gold px-1 text-[10px] font-black text-black">{pendingCount > 9 ? "9+" : pendingCount}</span> : null}
          </Link>

          <Link to="/profile" className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-zinc-300 hover:text-aurum-gold md:inline-flex">
            <UserRound size={16} /> {user?.telegramUsername || user?.phoneNumber || "Usuario"}
          </Link>

          <Button variant="ghost" onClick={logout} aria-label="Cerrar sesión">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
