import mongoose, { type ClientSession, type Types } from "mongoose";
import { env } from "../../config/env";
import {
  SYSTEM_RULES,
  MACHINE_PLAN_SLUGS,
  MACHINE_TYPES
} from "../../config/constants";
import { UserModel, type User } from "../../models/User.model";
import {
  ReferralPowerEventModel,
  REFERRAL_POWER_EVENT_STATUSES,
  REFERRAL_POWER_EVENT_TYPES
} from "../../models/ReferralPowerEvent.model";
import {
  ReferralRewardClaimModel,
  REFERRAL_REWARD_CLAIM_STATUSES
} from "../../models/ReferralRewardClaim.model";
import { MachinePlanModel } from "../../models/MachinePlan.model";
import { UserMachineModel, USER_MACHINE_SOURCE_TYPES } from "../../models/UserMachine.model";
import { badRequest, conflict, notFound } from "../../utils/errors";
import { calculateActivePowerPercent, calculateReferralStats } from "../../utils/referral-stats";
import { MachineService } from "../machines/machine.service";

export type ReferralStatusDTO = {
  referralCode: string;
  referralLink?: string;
  validReferralCount: number;
  activePowerPercent: number;
  maxPowerPercent: number;
  referralsNeededForMaxPower: number;
  totalExtraReferrals: number;
  usedExtraReferrals: number;
  availableExtraReferrals: number;
  requiredExtraReferralsPerReward: number;
  claimableRewardMachines: number;
};

function buildReferralLink(referralCode: string): string {
  const frontendUrl = (env.FRONTEND_URL || "https://aurumx-production-cdd0.up.railway.app").replace(/\/+$/, "");
  return `${frontendUrl}/auth?ref=${encodeURIComponent(referralCode)}`;
}


export class ReferralService {
  static getReferralStats(user: User): ReferralStatusDTO {
    const stats = calculateReferralStats({
      validReferralCount: user.validReferralCount,
      rewardReferralUsedCount: user.rewardReferralUsedCount
    });

    return {
      referralCode: user.referralCode,
      referralLink: buildReferralLink(user.referralCode),
      validReferralCount: stats.validReferralCount,
      activePowerPercent: stats.activePowerPercent,
      maxPowerPercent: stats.maxPowerPercent,
      referralsNeededForMaxPower: stats.referralsNeededForMaxPower,
      totalExtraReferrals: stats.totalExtraReferrals,
      usedExtraReferrals: stats.usedExtraReferrals,
      availableExtraReferrals: stats.availableExtraReferrals,
      requiredExtraReferralsPerReward: stats.requiredExtraReferralsPerReward,
      claimableRewardMachines: stats.claimableRewardMachines
    };
  }

  static async getReferralDashboard(user: User): Promise<ReferralStatusDTO & { referredUsers: unknown[] }> {
    const referredUsers = await UserModel.find({ referredByUserId: user._id })
      .select("telegramUsername firstName lastName createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    const activeEvents = await ReferralPowerEventModel.find({
      sponsorUserId: user._id,
      status: REFERRAL_POWER_EVENT_STATUSES.ACTIVE
    }).select("referredUserId");

    const validReferredIds = new Set(activeEvents.map((event) => event.referredUserId.toString()));

    return {
      ...ReferralService.getReferralStats(user),
      referredUsers: referredUsers.map((referred) => ({
        id: referred._id.toString(),
        telegramUsername: referred.telegramUsername,
        firstName: referred.firstName,
        lastName: referred.lastName,
        joinedAt: (referred as unknown as { createdAt?: Date }).createdAt,
        status: validReferredIds.has(referred._id.toString())
          ? "PAID_MACHINE_ACTIVE"
          : "REGISTERED_OR_VERIFIED",
        isValidReferral: validReferredIds.has(referred._id.toString())
      }))
    };
  }

  static async processValidReferral(params: {
    referredUserId: Types.ObjectId;
    sourceDepositOrderId: Types.ObjectId;
    sourceUserMachineId: Types.ObjectId;
    session?: ClientSession;
  }): Promise<Types.ObjectId | null> {
    const referredUser = await UserModel.findById(params.referredUserId).session(params.session ?? null);

    if (!referredUser?.referredByUserId) {
      return null;
    }

    const sponsorUserId = referredUser.referredByUserId;

    if (sponsorUserId.toString() === referredUser._id.toString()) {
      return null;
    }

    const existingEvent = await ReferralPowerEventModel.findOne({
      sponsorUserId,
      referredUserId: referredUser._id,
      type: REFERRAL_POWER_EVENT_TYPES.REFERRED_FIRST_PAID_MACHINE
    }).session(params.session ?? null);

    if (existingEvent) {
      return null;
    }

    await ReferralPowerEventModel.create(
      [
        {
          sponsorUserId,
          referredUserId: referredUser._id,
          sourceDepositOrderId: params.sourceDepositOrderId,
          sourceUserMachineId: params.sourceUserMachineId,
          powerPercent: SYSTEM_RULES.POWER_PER_VALID_REFERRAL_PERCENT,
          type: REFERRAL_POWER_EVENT_TYPES.REFERRED_FIRST_PAID_MACHINE,
          status: REFERRAL_POWER_EVENT_STATUSES.ACTIVE
        }
      ],
      { session: params.session }
    );

    await ReferralService.recalculateSponsorPower(sponsorUserId, params.session);
    return sponsorUserId as Types.ObjectId;
  }

  static async recalculateSponsorPower(
    sponsorUserId: Types.ObjectId,
    session?: ClientSession
  ): Promise<void> {
    const validReferralCount = await ReferralPowerEventModel.countDocuments({
      sponsorUserId,
      status: REFERRAL_POWER_EVENT_STATUSES.ACTIVE
    }).session(session ?? null);

    await UserModel.updateOne(
      { _id: sponsorUserId },
      {
        $set: {
          validReferralCount,
          activePowerPercent: calculateActivePowerPercent(validReferralCount)
        }
      },
      { session }
    );
  }

  static async claimRewardMachine(user: User) {
    const freshUser = await UserModel.findById(user._id);

    if (!freshUser) {
      throw notFound("User not found", "USER_NOT_FOUND");
    }

    const stats = ReferralService.getReferralStats(freshUser);

    if (freshUser.activePowerPercent < SYSTEM_RULES.MAX_POWER_PERCENT) {
      throw badRequest("Maximum referral power is required before claiming Aurora", "MAX_POWER_REQUIRED");
    }

    if (stats.availableExtraReferrals < SYSTEM_RULES.EXTRA_REFERRALS_PER_REWARD_MACHINE) {
      throw badRequest("Not enough extra referrals to claim Aurora", "NOT_ENOUGH_EXTRA_REFERRALS");
    }

    const rewardPlan = await MachinePlanModel.findOne({
      slug: MACHINE_PLAN_SLUGS.AURORA,
      type: MACHINE_TYPES.REWARD,
      isActive: true
    });

    if (!rewardPlan) {
      throw notFound("Aurora reward machine is not available", "REWARD_MACHINE_PLAN_NOT_FOUND");
    }

    const session = await mongoose.startSession();

    try {
      let claimId: string | null = null;
      let machineDTO: unknown = null;

      await session.withTransaction(async () => {
        const lockedUser = await UserModel.findById(freshUser._id).session(session);

        if (!lockedUser) {
          throw notFound("User not found", "USER_NOT_FOUND");
        }

        const lockedStats = ReferralService.getReferralStats(lockedUser);

        if (lockedStats.availableExtraReferrals < SYSTEM_RULES.EXTRA_REFERRALS_PER_REWARD_MACHINE) {
          throw conflict("Aurora reward was already claimed or referrals changed", "REWARD_NOT_AVAILABLE");
        }

        lockedUser.rewardReferralUsedCount += SYSTEM_RULES.EXTRA_REFERRALS_PER_REWARD_MACHINE;
        lockedUser.claimedRewardMachineCount += 1;
        await lockedUser.save({ session });

        const [claim] = await ReferralRewardClaimModel.create(
          [
            {
              userId: lockedUser._id,
              requiredExtraReferrals: SYSTEM_RULES.EXTRA_REFERRALS_PER_REWARD_MACHINE,
              usedReferralCount: SYSTEM_RULES.EXTRA_REFERRALS_PER_REWARD_MACHINE,
              rewardMachinePlanId: rewardPlan._id,
              status: REFERRAL_REWARD_CLAIM_STATUSES.CLAIMED,
              claimedAt: new Date()
            }
          ],
          { session }
        );

        if (!claim) {
          throw new Error("Failed to create referral reward claim");
        }

        const machine = await MachineService.createUserMachineFromPlan({
          userId: lockedUser._id,
          planId: rewardPlan._id,
          sourceType: USER_MACHINE_SOURCE_TYPES.REFERRAL_REWARD,
          referralRewardClaimId: claim._id,
          session
        });

        claim.userMachineId = machine._id;
        await claim.save({ session });

        claimId = claim._id.toString();
        machineDTO = MachineService.toDTO(machine, lockedUser, {
          name: rewardPlan.name,
          slug: rewardPlan.slug
        });
      });

      return {
        claimId,
        machine: machineDTO
      };
    } finally {
      await session.endSession();
    }
  }

  static async getRewardClaims(userId: Types.ObjectId) {
    return ReferralRewardClaimModel.find({ userId }).sort({ createdAt: -1 });
  }
}
