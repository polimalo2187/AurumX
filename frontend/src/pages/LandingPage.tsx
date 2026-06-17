import { motion } from "framer-motion";
import { ArrowRight, Factory, ShieldCheck, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BRAND } from "@/config/constants";

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-aurum-black bg-aurumGlow text-white">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-6 inline-flex rounded-full border border-aurum-gold/30 bg-aurum-gold/10 px-4 py-2 text-sm font-bold text-aurum-gold">
            {BRAND.commercialName}
          </div>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
            Plataforma industrial de máquinas de oro.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Activa máquinas, sigue ciclos de producción cada 24 horas, controla tu wallet interna y aumenta potencia con referidos válidos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth"><Button>Entrar con Telegram <ArrowRight size={18} className="ml-2" /></Button></Link>
            <Link to="/machines"><Button variant="secondary">Ver máquinas</Button></Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.1 }}>
          <Card className="relative overflow-hidden p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-aurum-gold/15 via-transparent to-transparent" />
            <div className="relative grid gap-4">
              <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-aurum-gold text-5xl font-black text-black shadow-aurum">A</div>
              <h2 className="text-3xl font-black">AurumX Mining</h2>
              <p className="text-zinc-400">Diseño oscuro, industrial y preparado para producción.</p>
              <div className="grid gap-3 pt-4">
                <Feature icon={<Factory />} title="Máquinas por niveles" />
                <Feature icon={<WalletCards />} title="Wallet interna USDT" />
                <Feature icon={<ShieldCheck />} title="Depósitos BEP20 verificados" />
              </div>
            </div>
          </Card>
        </motion.div>
      </section>
    </main>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-black/30 p-4 text-zinc-200"><span className="text-aurum-gold">{icon}</span>{title}</div>;
}
