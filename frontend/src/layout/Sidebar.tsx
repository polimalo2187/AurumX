import { Bell, Factory, Gauge, Gem, Landmark, Megaphone, ReceiptText, UserRound, WalletCards } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/utils/classNames";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/machines", label: "Máquinas", icon: Factory },
  { to: "/my-machines", label: "Mis máquinas", icon: Gem },
  { to: "/wallet", label: "Wallet", icon: WalletCards },
  { to: "/deposits", label: "Depósitos", icon: ReceiptText },
  { to: "/withdrawals", label: "Retiros", icon: Landmark },
  { to: "/referrals", label: "Referidos", icon: Megaphone },
  { to: "/notifications", label: "Notificaciones", icon: Bell },
  { to: "/profile", label: "Perfil", icon: UserRound }
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/[0.025] p-4 lg:block">
      <nav className="space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
              isActive ? "bg-aurum-gold text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
