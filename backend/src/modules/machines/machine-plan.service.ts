import { MachinePlanModel } from "../../models/MachinePlan.model";
import { notFound } from "../../utils/errors";

export class MachinePlanService {
  static async getActivePlans() {
    return MachinePlanModel.find({ isActive: true }).sort({ sortOrder: 1 });
  }

  static async getPlanOrFail(planId: string) {
    const plan = await MachinePlanModel.findOne({ _id: planId, isActive: true });

    if (!plan) {
      throw notFound("Machine plan not found", "MACHINE_PLAN_NOT_FOUND");
    }

    return plan;
  }

  static getPlanEconomics(plan: {
    type: string;
    priceUSDT: number;
    virtualPrincipalUSDT: number;
    payoutMultiplier: number;
    durationCycles: number;
  }) {
    const principalAmount = plan.type === "PAID" ? plan.priceUSDT : plan.virtualPrincipalUSDT;
    const maxPayoutAmount = principalAmount * plan.payoutMultiplier;
    const baseCycleRewardAmount = maxPayoutAmount / plan.durationCycles;

    return {
      principalAmount,
      maxPayoutAmount,
      baseCycleRewardAmount
    };
  }
}
