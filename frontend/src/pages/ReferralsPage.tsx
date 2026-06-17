import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { referralsApi } from "@/api/referrals.api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export function ReferralsPage() {
  const queryClient = useQueryClient();
  const { copied, copy } = useCopyToClipboard();
  const referrals = useQuery({ queryKey: ["referrals"], queryFn: referralsApi.me });
  const reward = useQuery({ queryKey: ["referral-reward-status"], queryFn: referralsApi.rewardStatus });
  const claimAurora = useMutation({
    mutationFn: referralsApi.claimAurora,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["referrals"] });
      void queryClient.invalidateQueries({ queryKey: ["referral-reward-status"] });
      void queryClient.invalidateQueries({ queryKey: ["my-machines"] });
    }
  });

  const link = referrals.data?.referralLink || "";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Red AurumX</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Referidos y potencia</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black">Potencia activa</h2>
          <p className="mt-2 text-zinc-400">Cada referido válido suma +2.5%. Máximo +30%.</p>
          <div className="mt-5"><ProgressBar value={referrals.data?.activePowerPercent || 0} max={30} /></div>
          <p className="mt-3 text-2xl font-black text-aurum-gold">+{referrals.data?.activePowerPercent || 0}%</p>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Aurora</h2>
          <p className="mt-2 text-zinc-400">Después de 12 referidos válidos, cada 10 excedentes desbloquean Aurora.</p>
          <div className="mt-5"><ProgressBar value={reward.data?.availableExtraReferrals || 0} max={10} /></div>
          <Button className="mt-5" disabled={(reward.data?.claimableRewardMachines || 0) < 1 || claimAurora.isPending} onClick={() => claimAurora.mutate()}>Reclamar Aurora</Button>
        </Card>
      </div>
      <Card>
        <h2 className="text-xl font-black">Tu enlace</h2>
        <div className="mt-3 rounded-2xl bg-black/40 p-4 font-mono text-sm break-all">{link || "Cargando..."}</div>
        <Button className="mt-3" variant="secondary" onClick={() => copy(link)} disabled={!link}>{copied ? "Copiado" : "Copiar enlace"}</Button>
      </Card>
    </div>
  );
}
