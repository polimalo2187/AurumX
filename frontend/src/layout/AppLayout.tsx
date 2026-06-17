import { Outlet } from "react-router-dom";
import { Header } from "@/layout/Header";
import { Sidebar } from "@/layout/Sidebar";
import { MobileNav } from "@/layout/MobileNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-aurum-black text-white">
      <Header />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 pb-28 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
