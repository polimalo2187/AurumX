import { MachinePlanModel } from "../../models/MachinePlan.model";
import { notFound } from "../../utils/errors";
import { calculatePlanEconomics } from "../../utils/economics";

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
    return calculatePlanEconomics(plan);
  }
}
