import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { withdrawalsApi } from "@/api/withdrawals.api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";

export function WithdrawalsPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const withdrawals = useQuery({ queryKey: ["withdrawals"], queryFn: withdrawalsApi.myWithdrawals });
  const request = useMutation({
    mutationFn: () => withdrawalsApi.request(Number(amount), address),
    onSuccess() {
      setAmount("");
      setAddress("");
      void queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <h1 className="text-3xl font-black">Solicitar retiro</h1>
        <p className="mt-2 text-sm text-zinc-400">Mínimo 1 USDT. Red obligatoria BSC/BEP20. Solo un retiro cada 24 horas.</p>
        <div className="mt-6 space-y-4">
          <input className="field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto USDT" inputMode="decimal" />
          <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Wallet BEP20 0x..." />
          <Button onClick={() => request.mutate()} disabled={!amount || !address || request.isPending}>Solicitar retiro</Button>
          {request.error ? <p className="text-sm text-red-300">No se pudo solicitar el retiro.</p> : null}
        </div>
      </Card>
      <Card>
        <h2 className="mb-4 text-xl font-black">Historial</h2>
        <div className="space-y-3">
          {(withdrawals.data || []).map((item) => (
            <div key={item.id} className="rounded-2xl bg-black/30 p-4">
              <div className="flex justify-between"><strong>{formatUSDT(item.amount)}</strong><span className="text-aurum-gold">{item.status}</span></div>
              <p className="mt-1 text-sm text-zinc-500">{formatDateTime(item.requestedAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
