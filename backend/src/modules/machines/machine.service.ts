import mongoose, { type ClientSession, type Types } from "mongoose";
import { MACHINE_PLAN_SLUGS, MACHINE_TYPES, SYSTEM_RULES } from "../../config/constants";
import { MachinePlanModel } from "../../models/MachinePlan.model";
import {
  FreeMachineClaimModel,
  FREE_MACHINE_CLAIM_STATUSES
} from "../../models/FreeMachineClaim.model";
import {
  UserMachineModel,
  USER_MACHINE_SOURCE_TYPES,
  USER_MACHINE_STATUSES,
  type UserMachine
} from "../../models/UserMachine.model";
import type { User } from "../../models/User.model";
import { badRequest, notFound } from "../../utils/errors";
import { addHours } from "../../utils/dates";
import { roundUSDT } from "../../utils/money";
import { calculateMachineReward, getPowerPercentForMachine } from "../../utils/economics";
import { MachinePlanService } from "./machine-plan.service";

export type UserMachineDTO = {
  id: string;
  machinePlanId: string;
  name?: string;
  slug?: string;
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
    return getPowerPercentForMachine(machineType, user.activePowerPercent);
  }

  static calculateEffectiveCycleReward(machine: UserMachine, user: User): number {
    return calculateMachineReward(machine, user.activePowerPercent).effectiveRewardAmount;
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
      name: plan?.name,
      slug: plan?.slug,
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
    const machines = await UserMachineModel.find({
      userId: user._id,
      status: { $ne: USER_MACHINE_STATUSES.CANCELLED }
    }).sort({ createdAt: -1 });

    const canonicalFreeMachine = machines
      .filter((machine) => machine.sourceType === USER_MACHINE_SOURCE_TYPES.FREE_CLAIM)
      .sort((a, b) => {
        const aCreatedAt = (a as unknown as { createdAt?: Date }).createdAt;
        const bCreatedAt = (b as unknown as { createdAt?: Date }).createdAt;
        const aTime = a.activatedAt?.getTime?.() ?? aCreatedAt?.getTime?.() ?? 0;
        const bTime = b.activatedAt?.getTime?.() ?? bCreatedAt?.getTime?.() ?? 0;
        return aTime - bTime;
      })[0];

    const visibleMachines = machines.filter((machine) => {
      if (machine.sourceType !== USER_MACHINE_SOURCE_TYPES.FREE_CLAIM) return true;
      return canonicalFreeMachine ? machine._id.equals(canonicalFreeMachine._id) : true;
    });

    const planIds = [...new Set(visibleMachines.map((machine) => machine.machinePlanId.toString()))];

    const plans = await MachinePlanModel.find({ _id: { $in: planIds } }).select("name slug");
    const planMap = new Map(plans.map((plan) => [plan._id.toString(), plan]));

    return visibleMachines.map((machine) => {
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

    const freePlan = await MachinePlanModel.findOne({
      slug: MACHINE_PLAN_SLUGS.PICO_INICIAL,
      type: MACHINE_TYPES.FREE,
      isActive: true
    });

    if (!freePlan) {
      throw notFound("Free machine plan not available", "FREE_MACHINE_PLAN_NOT_FOUND");
    }

    const existingFreeMachine = await UserMachineModel.findOne({
      userId: user._id,
      sourceType: USER_MACHINE_SOURCE_TYPES.FREE_CLAIM,
      status: { $ne: USER_MACHINE_STATUSES.CANCELLED }
    }).sort({ activatedAt: 1, createdAt: 1 });

    if (existingFreeMachine) {
      await FreeMachineClaimModel.updateOne(
        { userId: user._id },
        {
          $setOnInsert: {
            userId: user._id,
            claimedAt: existingFreeMachine.activatedAt ?? new Date()
          },
          $set: {
            telegramId: user.telegramId,
            phoneNumber: user.phoneNumber,
            userMachineId: existingFreeMachine._id,
            status: FREE_MACHINE_CLAIM_STATUSES.CLAIMED
          }
        },
        { upsert: true }
      );

      return MachineService.toDTO(existingFreeMachine, user, {
        name: freePlan.name,
        slug: freePlan.slug
      });
    }

    const existingClaim = await FreeMachineClaimModel.findOne({
      $or: [{ userId: user._id }, { telegramId: user.telegramId }, { phoneNumber: user.phoneNumber }]
    });

    if (existingClaim?.userMachineId) {
      const linkedMachine = await UserMachineModel.findOne({
        _id: existingClaim.userMachineId,
        status: { $ne: USER_MACHINE_STATUSES.CANCELLED }
      });

      if (linkedMachine) {
        return MachineService.toDTO(linkedMachine, user, {
          name: freePlan.name,
          slug: freePlan.slug
        });
      }
    }

    const session = await mongoose.startSession();

    try {
      let createdMachine: UserMachine | null = null;

      await session.withTransaction(async () => {
        const machineAlreadyCreated = await UserMachineModel.findOne({
          userId: user._id,
          sourceType: USER_MACHINE_SOURCE_TYPES.FREE_CLAIM,
          status: { $ne: USER_MACHINE_STATUSES.CANCELLED }
        })
          .sort({ activatedAt: 1, createdAt: 1 })
          .session(session);

        if (machineAlreadyCreated) {
          await FreeMachineClaimModel.updateOne(
            { userId: user._id },
            {
              $setOnInsert: {
                userId: user._id,
                claimedAt: machineAlreadyCreated.activatedAt ?? new Date()
              },
              $set: {
                telegramId: user.telegramId,
                phoneNumber: user.phoneNumber,
                userMachineId: machineAlreadyCreated._id,
                status: FREE_MACHINE_CLAIM_STATUSES.CLAIMED
              }
            },
            { upsert: true, session }
          );

          createdMachine = machineAlreadyCreated;
          return;
        }

        const duplicatedClaim = await FreeMachineClaimModel.findOne({
          $or: [{ userId: user._id }, { telegramId: user.telegramId }, { phoneNumber: user.phoneNumber }]
        }).session(session);

        if (duplicatedClaim?.userMachineId) {
          const linkedMachine = await UserMachineModel.findOne({
            _id: duplicatedClaim.userMachineId,
            status: { $ne: USER_MACHINE_STATUSES.CANCELLED }
          }).session(session);

          if (linkedMachine) {
            createdMachine = linkedMachine;
            return;
          }
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

        await FreeMachineClaimModel.updateOne(
          { userId: user._id },
          {
            $setOnInsert: {
              userId: user._id,
              claimedAt: now
            },
            $set: {
              telegramId: user.telegramId,
              phoneNumber: user.phoneNumber,
              userMachineId: machine._id,
              status: FREE_MACHINE_CLAIM_STATUSES.CLAIMED
            }
          },
          { upsert: true, session }
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
    } catch (error) {
      if ((error as { code?: unknown }).code === 11000) {
        const duplicatedMachine = await UserMachineModel.findOne({
          userId: user._id,
          sourceType: USER_MACHINE_SOURCE_TYPES.FREE_CLAIM,
          status: { $ne: USER_MACHINE_STATUSES.CANCELLED }
        }).sort({ activatedAt: 1, createdAt: 1 });

        if (duplicatedMachine) {
          return MachineService.toDTO(duplicatedMachine, user, {
            name: freePlan.name,
            slug: freePlan.slug
          });
        }
      }

      throw error;
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
    depositOrderId?: Types.ObjectId;
    referralRewardClaimId?: Types.ObjectId;
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
          depositOrderId: params.depositOrderId ?? null,
          referralRewardClaimId: params.referralRewardClaimId ?? null,
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
