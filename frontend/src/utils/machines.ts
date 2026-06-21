import type { MachinePlanDTO, UserMachineDTO } from "@/api/types";

export const MACHINE_IMAGE_MAP: Record<string, string> = {
  "pico-inicial": "/machines/pico-inicial.png",
  excavadora: "/machines/excavadora.png",
  perforadora: "/machines/perforadora.png",
  trituradora: "/machines/trituradora.png",
  "planta-elite": "/machines/planta-elite.png",
  dragalina: "/machines/dragalina.png",
  coloso: "/machines/coloso.png",
  aurora: "/machines/aurora.png"
};

export function normalizeMachineSlug(value?: string) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMachineImagePath(slug?: string, name?: string) {
  const normalizedSlug = normalizeMachineSlug(slug);
  if (normalizedSlug && MACHINE_IMAGE_MAP[normalizedSlug]) return MACHINE_IMAGE_MAP[normalizedSlug];

  const normalizedName = normalizeMachineSlug(name);
  if (normalizedName && MACHINE_IMAGE_MAP[normalizedName]) return MACHINE_IMAGE_MAP[normalizedName];

  return "/machines/excavadora.png";
}

export function getMachineName(machine: Pick<UserMachineDTO, "name" | "machineName" | "machineType">) {
  return machine.name || machine.machineName || machine.machineType;
}

export function getPlanTypeLabel(type: MachinePlanDTO["type"]) {
  if (type === "FREE") return "Gratis";
  if (type === "REWARD") return "Recompensa";
  return "Pago";
}

export function getPlanTypeTone(type: MachinePlanDTO["type"]): "gold" | "green" | "red" | "muted" {
  if (type === "PAID") return "gold";
  if (type === "REWARD") return "green";
  return "muted";
}

export function getMachineStatusLabel(status: UserMachineDTO["status"]) {
  if (status === "ACTIVE") return "Activa";
  if (status === "COMPLETED") return "Completada";
  if (status === "CANCELLED") return "Cancelada";
  return status;
}

export function getMachineStatusTone(status: UserMachineDTO["status"]): "gold" | "green" | "red" | "muted" {
  if (status === "ACTIVE") return "green";
  if (status === "COMPLETED") return "gold";
  if (status === "CANCELLED") return "red";
  return "muted";
}

export function payoutPercent(paidAmount?: number, maxPayoutAmount?: number) {
  if (!maxPayoutAmount || maxPayoutAmount <= 0) return 0;
  return Math.min((Number(paidAmount || 0) / Number(maxPayoutAmount)) * 100, 100);
}

export function dailyReturnPercent(plan: MachinePlanDTO) {
  const principal = plan.virtualPrincipalUSDT || plan.priceUSDT || 0;
  if (!principal) return 0;
  return (plan.baseCycleRewardAmount / principal) * 100;
}

export function formatPercent(value: number) {
  return `${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}
