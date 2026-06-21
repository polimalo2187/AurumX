import { Factory, Gauge, Gem, Megaphone, TrendingUp, WalletCards } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/utils/classNames";

const items = [
  { to: "/dashboard", label: "Inicio", icon: Gauge },
  { to: "/machines", label: "Máquinas", icon: Factory },
  { to: "/my-machines", label: "Activas", icon: Gem },
  { to: "/wallet", label: "Wallet", icon: WalletCards },
  { to: "/rewards", label: "Rewards", icon: TrendingUp },
  { to: "/referrals", label: "Red", icon: Megaphone }
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-aurum-black/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-6 gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold",
              isActive ? "bg-aurum-gold text-black" : "text-zinc-400"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
