import { asyncHandler } from "../../utils/async-handler";
import { MachinePlanService } from "./machine-plan.service";
import { MachineService } from "./machine.service";

export class MachineController {
  static getPlans = asyncHandler(async (_req, res) => {
    const plans = await MachinePlanService.getActivePlans();

    res.json({
      success: true,
      data: plans.map((plan) => {
        const economics = MachinePlanService.getPlanEconomics(plan);

        return {
          id: plan._id.toString(),
          slug: plan.slug,
          name: plan.name,
          type: plan.type,
          priceUSDT: plan.priceUSDT,
          virtualPrincipalUSDT: plan.virtualPrincipalUSDT,
          durationCycles: plan.durationCycles,
          cycleHours: plan.cycleHours,
          payoutMultiplier: plan.payoutMultiplier,
          principalAmount: economics.principalAmount,
          maxPayoutAmount: economics.maxPayoutAmount,
          baseCycleRewardAmount: economics.baseCycleRewardAmount,
          powerEnabled: plan.powerEnabled,
          isActive: plan.isActive,
          sortOrder: plan.sortOrder
        };
      })
    });
  });

  static getMyMachines = asyncHandler(async (req, res) => {
    const machines = await MachineService.getUserMachines(req.user);

    res.json({
      success: true,
      data: machines
    });
  });

  static claimFreeMachine = asyncHandler(async (req, res) => {
    const machine = await MachineService.claimFreeMachine(req.user);

    res.status(201).json({
      success: true,
      message: "Pico Inicial activado correctamente",
      data: machine
    });
  });
}
