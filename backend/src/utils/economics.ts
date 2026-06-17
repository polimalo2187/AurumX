import { MACHINE_TYPES, SYSTEM_RULES } from "../config/constants";
import { roundUSDT } from "./money";

export type MachinePlanEconomicsInput = {
  type: string;
  priceUSDT: number;
  virtualPrincipalUSDT: number;
  payoutMultiplier: number;
  durationCycles: number;
};

export type MachineRewardInput = {
  machineType: string;
  baseCycleRewardAmount: number;
  maxPayoutAmount: number;
  paidAmount: number;
};

export type MachineRewardCalculation = {
  powerPercentApplied: number;
  baseRewardAmount: number;
  effectiveRewardAmount: number;
  remainingAmount: number;
  rewardToPay: number;
};

export function getPlanPrincipalAmount(plan: MachinePlanEconomicsInput): number {
  return plan.type === MACHINE_TYPES.PAID ? plan.priceUSDT : plan.virtualPrincipalUSDT;
}

export function calculatePlanEconomics(plan: MachinePlanEconomicsInput) {
  const principalAmount = getPlanPrincipalAmount(plan);
  const maxPayoutAmount = roundUSDT(principalAmount * plan.payoutMultiplier);
  const baseCycleRewardAmount = roundUSDT(maxPayoutAmount / plan.durationCycles);

  return {
    principalAmount,
    maxPayoutAmount,
    baseCycleRewardAmount
  };
}

export function getPowerPercentForMachine(machineType: string, activePowerPercent: number): number {
  if (machineType !== MACHINE_TYPES.PAID) {
    return 0;
  }

  return Math.min(activePowerPercent, SYSTEM_RULES.MAX_POWER_PERCENT);
}

export function calculateMachineReward(
  machine: MachineRewardInput,
  activePowerPercent: number
): MachineRewardCalculation {
  const powerPercentApplied = getPowerPercentForMachine(machine.machineType, activePowerPercent);
  const baseRewardAmount = roundUSDT(machine.baseCycleRewardAmount);
  const effectiveRewardAmount = roundUSDT(baseRewardAmount * (1 + powerPercentApplied / 100));
  const remainingAmount = Math.max(roundUSDT(machine.maxPayoutAmount - machine.paidAmount), 0);
  const rewardToPay = roundUSDT(Math.min(effectiveRewardAmount, remainingAmount));

  return {
    powerPercentApplied,
    baseRewardAmount,
    effectiveRewardAmount,
    remainingAmount,
    rewardToPay
  };
}
