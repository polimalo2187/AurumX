import mongoose, { type ClientSession, type Types } from "mongoose";
import { MACHINE_PLAN_SLUGS, MACHINE_TYPES, SYSTEM_RULES } from "../../config/constants";
import { MachinePlanModel } from "../../models/MachinePlan.model";
import { FreeMachineClaimModel } from "../../models/FreeMachineClaim.model";
import {
  UserMachineModel,
  USER_MACHINE_SOURCE_TYPES,
  USER_MACHINE_STATUSES,
  type UserMachine
} from "../../models/UserMachine.model";
import type { User } from "../../models/User.model";
import { badRequest, conflict, notFound } from "../../utils/errors";
import { addHours } from "../../utils/dates";
import { roundUSDT } from "../../utils/money";
import { MachinePlanService } from "./machine-plan.service";

export type UserMachineDTO = {
  id: string;
  machinePlanId: string;
  machineName?: string;
  machineSlug?: string;
  machineType: string;
  sourceType: string;
  principalAmount: number;
  payoutMultiplier: number;
  maxPayoutAmount: number;
  baseCycleRewardAmount: number;
  effectiveCycleRewardAmount: number;
  powerPercentApplied: number;
  paidAmount: number;
  remainingAmount: number;
  paidCycles: number;
  durationCycles: number;
  cycleHours: number;
  status: string;
  activatedAt: Date;
  lastRewardAt: Date;
  nextRewardAt?: Date | null;
  completedAt?: Date | null;
};

export class MachineService {
  static calculatePowerPercentForMachine(machineType: string, user: User): number {
    if (machineType !== MACHINE_TYPES.PAID) {
      return 0;
    }

    return Math.min(user.activePowerPercent, SYSTEM_RULES.MAX_POWER_PERCENT);
  }

  static calculateEffectiveCycleReward(machine: UserMachine, user: User): number {
    const powerPercent = MachineService.calculatePowerPercentForMachine(machine.machineType, user);

    return roundUSDT(machine.baseCycleRewardAmount * (1 + powerPercent / 100));
  }

  static toDTO(machine: UserMachine, user: User, plan?: { name?: string; slug?: string }): UserMachineDTO {
    const powerPercentApplied = MachineService.calculatePowerPercentForMachine(
      machine.machineType,
      user
    );
    const effectiveCycleRewardAmount = MachineService.calculateEffectiveCycleReward(machine, user);
    const remainingAmount = Math.max(roundUSDT(machine.maxPayoutAmount - machine.paidAmount), 0);

    return {
      id: machine._id.toString(),
      machinePlanId: machine.machinePlanId.toString(),
      machineName: plan?.name,
      machineSlug: plan?.slug,
      machineType: machine.machineType,
      sourceType: machine.sourceType,
      principalAmount: machine.principalAmount,
      payoutMultiplier: machine.payoutMultiplier,
      maxPayoutAmount: machine.maxPayoutAmount,
      baseCycleRewardAmount: machine.baseCycleRewardAmount,
      effectiveCycleRewardAmount,
      powerPercentApplied,
      paidAmount: machine.paidAmount,
      remainingAmount,
      paidCycles: machine.paidCycles,
      durationCycles: machine.durationCycles,
      cycleHours: machine.cycleHours,
      status: machine.status,
      activatedAt: machine.activatedAt,
      lastRewardAt: machine.lastRewardAt,
      nextRewardAt: machine.nextRewardAt,
      completedAt: machine.completedAt
    };
  }

  static async getUserMachines(user: User) {
    const machines = await UserMachineModel.find({ userId: user._id }).sort({ createdAt: -1 });
    const planIds = [...new Set(machines.map((machine) => machine.machinePlanId.toString()))];

    const plans = await MachinePlanModel.find({ _id: { $in: planIds } }).select("name slug");
    const planMap = new Map(plans.map((plan) => [plan._id.toString(), plan]));

    return machines.map((machine) => {
      const plan = planMap.get(machine.machinePlanId.toString());

      return MachineService.toDTO(machine, user, {
        name: plan?.name,
        slug: plan?.slug
      });
    });
  }

  static async claimFreeMachine(user: User) {
    if (!user.phoneVerified) {
      throw badRequest("Telegram phone verification is required", "PHONE_NOT_VERIFIED");
    }

    const existingClaim = await FreeMachineClaimModel.findOne({ userId: user._id });

    if (existingClaim) {
      throw conflict("Free machine already claimed", "FREE_MACHINE_ALREADY_CLAIMED");
    }

    const freePlan = await MachinePlanModel.findOne({
      slug: MACHINE_PLAN_SLUGS.PICO_INICIAL,
      type: MACHINE_TYPES.FREE,
      isActive: true
    });

    if (!freePlan) {
      throw notFound("Free machine plan not available", "FREE_MACHINE_PLAN_NOT_FOUND");
    }

    const session = await mongoose.startSession();

    try {
      let createdMachine: UserMachine | null = null;

      await session.withTransaction(async () => {
        const duplicatedClaim = await FreeMachineClaimModel.findOne({
          $or: [{ userId: user._id }, { telegramId: user.telegramId }, { phoneNumber: user.phoneNumber }]
        }).session(session);

        if (duplicatedClaim) {
          throw conflict("Free machine already claimed", "FREE_MACHINE_ALREADY_CLAIMED");
        }

        const now = new Date();
        const economics = MachinePlanService.getPlanEconomics(freePlan);

        const [machine] = await UserMachineModel.create(
          [
            {
              userId: user._id,
              machinePlanId: freePlan._id,
              sourceType: USER_MACHINE_SOURCE_TYPES.FREE_CLAIM,
              machineType: MACHINE_TYPES.FREE,
              principalAmount: economics.principalAmount,
              payoutMultiplier: freePlan.payoutMultiplier,
              maxPayoutAmount: economics.maxPayoutAmount,
              durationCycles: freePlan.durationCycles,
              cycleHours: freePlan.cycleHours,
              baseCycleRewardAmount: economics.baseCycleRewardAmount,
              paidAmount: 0,
              paidCycles: 0,
              status: USER_MACHINE_STATUSES.ACTIVE,
              activatedAt: now,
              lastRewardAt: now,
              nextRewardAt: addHours(now, freePlan.cycleHours)
            }
          ],
          { session }
        );

        if (!machine) {
          throw new Error("Failed to create free machine");
        }

        await FreeMachineClaimModel.create(
          [
            {
              userId: user._id,
              telegramId: user.telegramId,
              phoneNumber: user.phoneNumber,
              userMachineId: machine._id,
              claimedAt: now
            }
          ],
          { session }
        );

        createdMachine = machine;
      });

      if (!createdMachine) {
        throw new Error("Free machine transaction failed");
      }

      return MachineService.toDTO(createdMachine, user, {
        name: freePlan.name,
        slug: freePlan.slug
      });
    } finally {
      await session.endSession();
    }
  }

  static async getMachineSummary(userId: Types.ObjectId) {
    const [active, completed, freeClaimed] = await Promise.all([
      UserMachineModel.countDocuments({ userId, status: USER_MACHINE_STATUSES.ACTIVE }),
      UserMachineModel.countDocuments({ userId, status: USER_MACHINE_STATUSES.COMPLETED }),
      FreeMachineClaimModel.exists({ userId })
    ]);

    return {
      active,
      completed,
      freeClaimed: Boolean(freeClaimed)
    };
  }

  static async createUserMachineFromPlan(params: {
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    sourceType: (typeof USER_MACHINE_SOURCE_TYPES)[keyof typeof USER_MACHINE_SOURCE_TYPES];
    session?: ClientSession;
  }) {
    const plan = await MachinePlanModel.findById(params.planId).session(params.session ?? null);

    if (!plan) {
      throw notFound("Machine plan not found", "MACHINE_PLAN_NOT_FOUND");
    }

    const now = new Date();
    const economics = MachinePlanService.getPlanEconomics(plan);

    const [machine] = await UserMachineModel.create(
      [
        {
          userId: params.userId,
          machinePlanId: plan._id,
          sourceType: params.sourceType,
          machineType: plan.type,
          principalAmount: economics.principalAmount,
          payoutMultiplier: plan.payoutMultiplier,
          maxPayoutAmount: economics.maxPayoutAmount,
          durationCycles: plan.durationCycles,
          cycleHours: plan.cycleHours,
          baseCycleRewardAmount: economics.baseCycleRewardAmount,
          paidAmount: 0,
          paidCycles: 0,
          status: USER_MACHINE_STATUSES.ACTIVE,
          activatedAt: now,
          lastRewardAt: now,
          nextRewardAt: addHours(now, plan.cycleHours)
        }
      ],
      { session: params.session }
    );

    if (!machine) {
      throw new Error("Failed to create user machine");
    }

    return machine;
  }
}
