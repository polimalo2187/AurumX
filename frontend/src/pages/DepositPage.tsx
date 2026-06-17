import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { depositsApi, type DepositOrderDTO } from "@/api/deposits.api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { formatUSDT } from "@/utils/formatMoney";

export function DepositPage() {
  const { machinePlanId = "" } = useParams();
  const [order, setOrder] = useState<DepositOrderDTO | null>(null);
  const [txHash, setTxHash] = useState("");
  const { copied, copy } = useCopyToClipboard();

  const createOrder = useMutation({ mutationFn: () => depositsApi.createOrder(machinePlanId), onSuccess: setOrder });
  const submitHash = useMutation({ mutationFn: () => depositsApi.submitHash(order!.id, txHash) });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Depósito BEP20</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Activar máquina</h1>
      </div>

      <Card>
        {!order ? (
          <>
            <h2 className="text-xl font-black">Crear orden de depósito</h2>
            <p className="mt-2 text-zinc-400">El backend generará la orden y verificará automáticamente la transacción en BSC.</p>
            <Button className="mt-5" onClick={() => createOrder.mutate()} disabled={createOrder.isPending}>Crear orden</Button>
          </>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-aurum-gold/20 bg-aurum-gold/10 p-4">
              <p className="text-sm text-zinc-300">Monto exacto</p>
              <strong className="text-2xl text-aurum-gold">{formatUSDT(order.expectedAmountUSDT)}</strong>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Wallet destino BSC/BEP20</p>
              <div className="mt-2 rounded-2xl bg-black/40 p-4 font-mono text-sm text-white break-all">{order.depositAddress}</div>
              <Button className="mt-3" variant="secondary" onClick={() => copy(order.depositAddress)}>{copied ? "Copiado" : "Copiar wallet"}</Button>
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-300">Hash / TXID</label>
              <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-aurum-gold" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." />
            </div>
            <Button onClick={() => submitHash.mutate()} disabled={!txHash || submitHash.isPending}>Enviar hash y verificar</Button>
            {submitHash.data ? <p className="text-sm text-aurum-gold">{submitHash.data.message}</p> : null}
          </div>
        )}
      </Card>
    </div>
  );
}
