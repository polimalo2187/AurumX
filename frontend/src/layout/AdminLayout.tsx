import { NavLink, Outlet } from "react-router-dom";
import { Header } from "@/layout/Header";
import { cn } from "@/utils/classNames";

const adminItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "Usuarios" },
  { to: "/admin/deposits", label: "Depósitos" },
  { to: "/admin/withdrawals", label: "Retiros" },
  { to: "/admin/risk", label: "Riesgo" },
  { to: "/admin/audit", label: "Auditoría" }
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-aurum-black text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="mb-6 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.035] p-2">
          <nav className="flex min-w-max gap-2">
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "rounded-2xl px-4 py-2 text-sm font-bold transition",
                  isActive ? "bg-aurum-gold text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
