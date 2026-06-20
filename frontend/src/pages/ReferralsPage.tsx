import { useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Gem, Gift, Link as LinkIcon, Network, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { referralsApi } from "@/api/referrals.api";
import { useAuth } from "@/auth/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export function ReferralsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { copied, copy } = useCopyToClipboard();

  const referrals = useQuery({ queryKey: ["referrals"], queryFn: referralsApi.me });
  const reward = useQuery({ queryKey: ["referral-reward-status"], queryFn: referralsApi.rewardStatus });

  const claimAurora = useMutation({
    mutationFn: referralsApi.claimAurora,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["referrals"] });
      void queryClient.invalidateQueries({ queryKey: ["referral-reward-status"] });
      void queryClient.invalidateQueries({ queryKey: ["my-machines"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const link = referrals.data?.referralLink || "";
  const code = referrals.data?.referralCode || user?.referralCode || "";
  const validReferrals = referrals.data?.validReferralCount || reward.data?.validReferralCount || user?.validReferralCount || 0;
  const activePower = referrals.data?.activePowerPercent || reward.data?.activePowerPercent || user?.activePowerPercent || 0;
  const maxPower = referrals.data?.maxPowerPercent || 30;
  const referralsToMax = Math.max(0, Math.ceil((maxPower - activePower) / 2.5));
  const availableExtra = reward.data?.availableExtraReferrals ?? referrals.data?.extraReferralsAvailable ?? 0;
  const claimableAuroras = reward.data?.claimableRewardMachines ?? referrals.data?.rewardMachinesClaimable ?? 0;
  const auroraRequired = reward.data?.requiredExtraReferralsPerReward ?? referrals.data?.extraReferralsPerRewardMachine ?? 10;

  const powerSteps = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);

  if (referrals.isLoading || reward.isLoading) return <div className="screen-center">Cargando red AurumX...</div>;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-aurum-gold/20 bg-gradient-to-br from-aurum-gold/15 via-white/[0.045] to-black">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-aurum-gold/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Red AurumX</p>
            <h1 className="mt-3 text-4xl font-black md:text-6xl">Referidos, potencia y Aurora</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Cada referido válido aumenta la potencia de tus máquinas de pago. Cuando llegas al máximo, los excedentes desbloquean máquinas Aurora.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
            <p className="text-sm text-zinc-400">Potencia activa</p>
            <strong className="mt-2 block text-5xl text-aurum-gold">+{activePower}%</strong>
            <div className="mt-4"><ProgressBar value={activePower} max={maxPower} /></div>
            <p className="mt-3 text-sm text-zinc-400">{activePower >= maxPower ? "Potencia máxima alcanzada." : `Faltan ${referralsToMax} referidos válidos para +${maxPower}%.`}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Users />} label="Referidos válidos" value={String(validReferrals)} />
        <Metric icon={<Zap />} label="Potencia máxima" value={`+${maxPower}%`} />
        <Metric icon={<Sparkles />} label="Extras disponibles" value={String(availableExtra)} />
        <Metric icon={<Gem />} label="Auroras reclamables" value={String(claimableAuroras)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black"><Network className="text-aurum-gold" /> Escalera de potencia</h2>
          <p className="mt-2 text-sm text-zinc-400">Cada referido válido suma +2.5%. El máximo es +30% con 12 referidos válidos.</p>
          <div className="mt-5 grid grid-cols-6 gap-2">
            {powerSteps.map((step) => {
              const reached = validReferrals >= step;
              return (
                <div key={step} className={`rounded-2xl border p-3 text-center ${reached ? "border-aurum-gold/40 bg-aurum-gold/15 text-aurum-gold" : "border-white/10 bg-black/30 text-zinc-500"}`}>
                  <span className="block text-xs">Ref</span>
                  <strong>{step}</strong>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-2xl bg-black/30 p-4">
            <div className="mb-2 flex justify-between text-sm text-zinc-300">
              <span>{validReferrals} / 12 válidos</span>
              <span>+{activePower}% / +{maxPower}%</span>
            </div>
            <ProgressBar value={Math.min(validReferrals, 12)} max={12} />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-aurum-gold/20">
          <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-aurum-gold/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black"><Trophy className="text-aurum-gold" /> Máquina Aurora</h2>
                <p className="mt-2 text-sm text-zinc-400">Después de los primeros 12 referidos válidos, cada {auroraRequired} referidos extra desbloquean una Aurora.</p>
              </div>
              <Badge tone={claimableAuroras > 0 ? "green" : "muted"}>{claimableAuroras > 0 ? "Disponible" : "Bloqueada"}</Badge>
            </div>
            <div className="mt-5"><ProgressBar value={Math.min(availableExtra, auroraRequired)} max={auroraRequired} /></div>
            <p className="mt-3 text-sm text-zinc-400">{availableExtra} / {auroraRequired} referidos extra disponibles para la próxima Aurora.</p>
            <Button className="mt-5 w-full" disabled={claimableAuroras < 1 || claimAurora.isPending} onClick={() => claimAurora.mutate()}>
              <Gift size={16} className="mr-2" /> {claimAurora.isPending ? "Reclamando..." : "Reclamar Aurora"}
            </Button>
            {claimAurora.isError ? <p className="mt-3 text-sm text-red-300">No se pudo reclamar Aurora. Revisa si tienes suficientes referidos extra.</p> : null}
            {claimAurora.isSuccess ? <p className="mt-3 text-sm text-emerald-300">Aurora reclamada correctamente.</p> : null}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="flex items-center gap-2 text-xl font-black"><LinkIcon className="text-aurum-gold" /> Tu enlace de invitación</h2>
        <p className="mt-2 text-sm text-zinc-400">Comparte este enlace. El referido cuenta como válido cuando verifica Telegram y activa una máquina de pago.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl bg-black/40 p-4 font-mono text-sm break-all">{link || "Enlace no disponible todavía"}</div>
          <Button variant="secondary" onClick={() => copy(link)} disabled={!link}><Copy size={16} className="mr-2" /> {copied ? "Copiado" : "Copiar enlace"}</Button>
        </div>
        <div className="mt-3 rounded-2xl bg-black/30 p-4 text-sm text-zinc-400">
          Código directo: <strong className="text-aurum-gold">{code || "—"}</strong>
        </div>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-aurum-gold/10 text-aurum-gold">{icon}</div>
        <Badge tone="gold">Red</Badge>
      </div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <strong className="mt-1 block text-3xl text-white">{value}</strong>
    </Card>
  );
}
