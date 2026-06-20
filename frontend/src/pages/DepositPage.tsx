import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Copy, ExternalLink, Loader2, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { depositsApi, type DepositOrderDTO, type DepositStatus } from "@/api/deposits.api";
import { machinesApi } from "@/api/machines.api";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { formatDateTime } from "@/utils/formatDate";
import { formatUSDT } from "@/utils/formatMoney";

type StepState = "ready" | "active" | "done" | "danger";

const MACHINE_IMAGE_MAP: Record<string, string> = {
  "pico-inicial": "/machines/pico-inicial.png",
  excavadora: "/machines/excavadora.png",
  perforadora: "/machines/perforadora.png",
  trituradora: "/machines/trituradora.png",
  "planta-elite": "/machines/planta-elite.png",
  dragalina: "/machines/dragalina.png",
  coloso: "/machines/coloso.png",
  aurora: "/machines/aurora.png"
};

function normalizeMachineSlug(value?: string) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMachineImagePath(slug?: string, name?: string) {
  const normalizedSlug = normalizeMachineSlug(slug);
  if (normalizedSlug && MACHINE_IMAGE_MAP[normalizedSlug]) return MACHINE_IMAGE_MAP[normalizedSlug];

  const normalizedName = normalizeMachineSlug(name);
  if (normalizedName && MACHINE_IMAGE_MAP[normalizedName]) return MACHINE_IMAGE_MAP[normalizedName];

  return "/machines/excavadora.png";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function getDepositStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: "Esperando depósito",
    HASH_SUBMITTED: "Hash enviado",
    VERIFYING: "Verificando blockchain",
    CONFIRMED: "Confirmado",
    REJECTED: "Rechazado",
    EXPIRED: "Expirado",
    NEEDS_REVIEW: "Revisión manual"
  };
  return labels[status || ""] || status || "Pendiente";
}

function getDepositTone(status?: string): "gold" | "green" | "red" | "muted" {
  if (status === "CONFIRMED") return "green";
  if (status === "REJECTED" || status === "EXPIRED") return "red";
  if (status === "NEEDS_REVIEW" || status === "VERIFYING" || status === "HASH_SUBMITTED") return "gold";
  return "muted";
}

function bscScanTxUrl(hash?: string | null) {
  return hash ? `https://bscscan.com/tx/${hash}` : "";
}

function getStepStates(status?: string): [StepState, StepState, StepState, StepState] {
  if (!status || status === "PENDING_PAYMENT") return ["active", "ready", "ready", "ready"];
  if (status === "HASH_SUBMITTED") return ["done", "active", "ready", "ready"];
  if (status === "VERIFYING" || status === "NEEDS_REVIEW") return ["done", "done", "active", "ready"];
  if (status === "CONFIRMED") return ["done", "done", "done", "done"];
  return ["done", "done", "danger", "danger"];
}

function StepBadge({ state, label }: { state: StepState; label: string }) {
  const classes: Record<StepState, string> = {
    ready: "border-white/10 bg-white/5 text-zinc-500",
    active: "border-aurum-gold/30 bg-aurum-gold/10 text-aurum-gold",
    done: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    danger: "border-red-400/30 bg-red-400/10 text-red-300"
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${classes[state]}`}>{label}</span>;
}

function DepositTimeline({ status }: { status?: string }) {
  const [payment, hash, verify, activation] = getStepStates(status);
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      <StepBadge state={payment} label="1. Depósito" />
      <StepBadge state={hash} label="2. Hash" />
      <StepBadge state={verify} label="3. Verificación" />
      <StepBadge state={activation} label="4. Activación" />
    </div>
  );
}

export function DepositPage() {
  const { machinePlanId = "" } = useParams();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<DepositOrderDTO | null>(null);
  const [txHash, setTxHash] = useState("");
  const { copied, copy } = useCopyToClipboard();

  const plans = useQuery({ queryKey: ["machine-plans"], queryFn: machinesApi.plans });
  const deposits = useQuery({ queryKey: ["deposits"], queryFn: depositsApi.myDeposits });

  const selectedPlan = useMemo(() => {
    if (!machinePlanId) return undefined;
    return (plans.data || []).find((plan) => (plan.id || plan._id) === machinePlanId);
  }, [machinePlanId, plans.data]);

  const selectedOrder = order;
  const selectedStatus = selectedOrder?.status as DepositStatus | string | undefined;

  const createOrder = useMutation({
    mutationFn: () => depositsApi.createOrder(machinePlanId),
    onSuccess(data) {
      setOrder(data);
      void queryClient.invalidateQueries({ queryKey: ["deposits"] });
    }
  });

  const submitHash = useMutation({
    mutationFn: () => depositsApi.submitHash(selectedOrder!.id, txHash.trim()),
    onSuccess(result) {
      if (result.order) setOrder(result.order);
      setTxHash("");
      void queryClient.invalidateQueries({ queryKey: ["deposits"] });
      void queryClient.invalidateQueries({ queryKey: ["my-machines"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const imageSrc = getMachineImagePath(selectedPlan?.slug, selectedPlan?.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Depósito BSC / BEP20</p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">Activar máquina</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">Crea una orden, envía USDT BEP20 al wallet oficial y pega el hash para activar la máquina automáticamente.</p>
        </div>
        <Link to="/machines">
          <Button variant="secondary">Ver catálogo</Button>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          {machinePlanId ? (
            <Card className="overflow-hidden p-0">
              <div className="relative h-56 overflow-hidden bg-black/40">
                <img src={imageSrc} alt={selectedPlan?.name || "Máquina AurumX"} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <Badge tone="gold">Máquina seleccionada</Badge>
                  <h2 className="mt-3 text-3xl font-black">{selectedPlan?.name || "Cargando máquina..."}</h2>
                  <p className="mt-1 text-zinc-300">Precio: {formatUSDT(selectedPlan?.priceUSDT)}</p>
                </div>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/30 p-4"><p className="text-sm text-zinc-500">Producción</p><strong>{formatUSDT(selectedPlan?.baseCycleRewardAmount)}</strong></div>
                <div className="rounded-2xl bg-black/30 p-4"><p className="text-sm text-zinc-500">Máximo</p><strong>{formatUSDT(selectedPlan?.maxPayoutAmount)}</strong></div>
                <div className="rounded-2xl bg-black/30 p-4"><p className="text-sm text-zinc-500">Duración</p><strong>{selectedPlan?.durationCycles ?? 20} días</strong></div>
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="text-xl font-black">Selecciona una máquina para activar</h2>
              <p className="mt-2 text-sm text-zinc-400">Desde el catálogo puedes elegir Perforadora, Trituradora, Dragalina, Coloso u otra máquina pagada para crear una orden de depósito.</p>
              <Link to="/machines"><Button className="mt-5">Ir al catálogo</Button></Link>
            </Card>
          )}

          <Card>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 text-aurum-gold" />
              <div>
                <h3 className="text-lg font-black">Reglas de depósito</h3>
                <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                  <li>Envía solo <strong className="text-white">USDT por BSC / BEP20</strong>.</li>
                  <li>El monto debe ser igual o mayor al monto exacto de la orden.</li>
                  <li>No reutilices hashes. Cada hash solo puede activar una orden.</li>
                  <li>Si la red no confirma a tiempo, el estado quedará esperando confirmaciones o revisión.</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Orden de activación</h2>
              <p className="mt-1 text-sm text-zinc-400">Estado: <span className="text-white">{getDepositStatusLabel(selectedStatus)}</span></p>
            </div>
            <Badge tone={getDepositTone(selectedStatus)}>{getDepositStatusLabel(selectedStatus)}</Badge>
          </div>

          <div className="mt-5">
            <DepositTimeline status={selectedStatus} />
          </div>

          {!selectedOrder ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-start gap-3">
                <ReceiptText className="mt-1 text-aurum-gold" />
                <div>
                  <h3 className="font-black">Crear orden de depósito</h3>
                  <p className="mt-1 text-sm text-zinc-400">El sistema generará la dirección oficial y el monto exacto que debes enviar.</p>
                </div>
              </div>
              <Button className="mt-5 w-full" onClick={() => createOrder.mutate()} disabled={!machinePlanId || createOrder.isPending}>
                {createOrder.isPending ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                Crear orden
              </Button>
              {createOrder.error ? <p className="mt-3 text-sm text-red-300">{getErrorMessage(createOrder.error, "No se pudo crear la orden.")}</p> : null}
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-3xl border border-aurum-gold/20 bg-aurum-gold/10 p-5">
                <p className="text-sm text-zinc-300">Monto exacto a enviar</p>
                <strong className="text-3xl text-aurum-gold">{formatUSDT(selectedOrder.expectedAmountUSDT)}</strong>
                <p className="mt-2 text-xs text-zinc-400">Red: {selectedOrder.network} / {selectedOrder.tokenStandard || "BEP20"}</p>
              </div>

              <div>
                <p className="text-sm text-zinc-400">Wallet destino oficial</p>
                <div className="mt-2 break-all rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-white">{selectedOrder.depositAddress}</div>
                <Button className="mt-3" variant="secondary" onClick={() => copy(selectedOrder.depositAddress)}><Copy size={15} className="mr-2" />{copied ? "Copiado" : "Copiar wallet"}</Button>
              </div>

              {selectedOrder.expiresAt ? (
                <div className="flex items-center gap-2 rounded-2xl bg-black/30 p-4 text-sm text-zinc-300">
                  <Clock size={16} className="text-aurum-gold" /> Expira: {formatDateTime(selectedOrder.expiresAt)}
                </div>
              ) : null}

              <div>
                <label className="text-sm font-bold text-zinc-300">Hash / TXID de BSC</label>
                <input className="field mt-2 font-mono text-sm" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." />
                <p className="mt-2 text-xs text-zinc-500">Pega el hash después de enviar el USDT BEP20. El backend verificará receptor, contrato USDT y monto.</p>
              </div>

              <Button className="w-full" onClick={() => submitHash.mutate()} disabled={!txHash.trim() || submitHash.isPending || selectedStatus === "CONFIRMED"}>
                {submitHash.isPending ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                Enviar hash y verificar
              </Button>

              {submitHash.data ? (
                <div className="flex items-start gap-2 rounded-2xl border border-aurum-gold/20 bg-aurum-gold/10 p-4 text-sm text-aurum-gold">
                  <CheckCircle2 size={16} className="mt-0.5" /> {submitHash.data.message}
                </div>
              ) : null}
              {submitHash.error ? (
                <div className="flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                  <AlertTriangle size={16} className="mt-0.5" /> {getErrorMessage(submitHash.error, "No se pudo verificar el hash.")}
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Mis depósitos</h2>
            <p className="mt-1 text-sm text-zinc-400">Historial de órdenes y estados de verificación.</p>
          </div>
          <Wallet className="text-aurum-gold" />
        </div>
        <div className="mt-5 space-y-3">
          {(deposits.data || []).map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-white">{item.machineName || "Máquina"}</strong>
                    <Badge tone={getDepositTone(item.status)}>{getDepositStatusLabel(item.status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{formatDateTime(item.createdAt)} · {formatUSDT(item.expectedAmountUSDT)}</p>
                  {item.userSubmittedTxHash ? <p className="mt-2 break-all font-mono text-xs text-zinc-400">{item.userSubmittedTxHash}</p> : null}
                  {item.rejectionReason ? <p className="mt-2 text-sm text-red-300">{item.rejectionReason}</p> : null}
                </div>
                {item.userSubmittedTxHash ? (
                  <a href={bscScanTxUrl(item.userSubmittedTxHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-aurum-gold">
                    BscScan <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
          {deposits.data?.length === 0 ? <p className="text-sm text-zinc-500">Todavía no tienes depósitos.</p> : null}
        </div>
      </Card>
    </div>
  );
}
