import { Types } from "mongoose";
import { env } from "../../config/env";
import { UserModel } from "../../models/User.model";
import {
  RiskFlagModel,
  RISK_FLAG_SEVERITIES,
  RISK_FLAG_STATUSES,
  RISK_FLAG_TYPES
} from "../../models/RiskFlag.model";
import {
  WithdrawalRequestModel,
  WITHDRAWAL_STATUSES
} from "../../models/WithdrawalRequest.model";
import {
  ReferralPowerEventModel,
  REFERRAL_POWER_EVENT_STATUSES
} from "../../models/ReferralPowerEvent.model";
import { badRequest, notFound } from "../../utils/errors";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS, AUDIT_ACTOR_TYPES } from "../../models/AuditLog.model";

const SEVERITY_WEIGHT = {
  [RISK_FLAG_SEVERITIES.LOW]: 1,
  [RISK_FLAG_SEVERITIES.MEDIUM]: 2,
  [RISK_FLAG_SEVERITIES.HIGH]: 3,
  [RISK_FLAG_SEVERITIES.CRITICAL]: 4
} as const;

function highestSeverity(severities: string[]): string {
  return severities.reduce((highest, current) => {
    const currentWeight = SEVERITY_WEIGHT[current as keyof typeof SEVERITY_WEIGHT] ?? 0;
    const highestWeight = SEVERITY_WEIGHT[highest as keyof typeof SEVERITY_WEIGHT] ?? 0;
    return currentWeight > highestWeight ? current : highest;
  }, RISK_FLAG_SEVERITIES.LOW);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export class RiskService {
  static async createOrUpdateFlag(params: {
    userId: Types.ObjectId;
    type: string;
    severity: string;
    score: number;
    reason: string;
    sourceType: string;
    sourceId?: Types.ObjectId | null;
    metadata?: Record<string, unknown>;
  }) {
    const flag = await RiskFlagModel.findOneAndUpdate(
      {
        userId: params.userId,
        type: params.type,
        sourceType: params.sourceType,
        status: RISK_FLAG_STATUSES.OPEN
      },
      {
        $set: {
          severity: params.severity,
          score: Math.min(Math.max(params.score, 0), 100),
          reason: params.reason,
          sourceId: params.sourceId ?? null,
          metadata: params.metadata ?? null
        },
        $setOnInsert: {
          userId: params.userId,
          type: params.type,
          sourceType: params.sourceType,
          status: RISK_FLAG_STATUSES.OPEN
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await RiskService.recalculateUserRisk(params.userId);

    await AuditService.log({
      actor: { type: AUDIT_ACTOR_TYPES.SYSTEM },
      action: AUDIT_ACTIONS.RISK_FLAG_CREATED,
      targetType: "RiskFlag",
      targetId: flag._id,
      after: {
        userId: params.userId.toString(),
        type: params.type,
        severity: params.severity,
        score: params.score
      },
      metadata: params.metadata ?? null
    });

    return flag;
  }

  static async recalculateUserRisk(userId: Types.ObjectId) {
    const openFlags = await RiskFlagModel.find({
      userId,
      status: RISK_FLAG_STATUSES.OPEN
    }).select("severity score");

    const riskScore = Math.min(
      openFlags.reduce((total, flag) => total + flag.score, 0),
      100
    );

    const riskLevel = openFlags.length > 0
      ? highestSeverity(openFlags.map((flag) => flag.severity))
      : "NONE";

    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          riskFlagged: openFlags.length > 0,
          riskLevel,
          riskScore,
          riskFlagsCount: openFlags.length,
          riskLastEvaluatedAt: new Date()
        }
      }
    );

    return { riskFlagged: openFlags.length > 0, riskLevel, riskScore, riskFlagsCount: openFlags.length };
  }

  static async evaluateWithdrawal(withdrawalId: Types.ObjectId | string) {
    const withdrawal = await WithdrawalRequestModel.findById(withdrawalId);

    if (!withdrawal) {
      throw notFound("Withdrawal request not found", "WITHDRAWAL_NOT_FOUND");
    }

    const userId = withdrawal.userId as Types.ObjectId;
    const checks: unknown[] = [];

    const usersUsingAddress = await WithdrawalRequestModel.distinct("userId", {
      destinationAddress: withdrawal.destinationAddress,
      status: { $in: [WITHDRAWAL_STATUSES.PENDING, WITHDRAWAL_STATUSES.APPROVED] }
    });

    if (usersUsingAddress.length >= env.RISK_SHARED_WITHDRAWAL_WALLET_USER_COUNT) {
      checks.push(
        await RiskService.createOrUpdateFlag({
          userId,
          type: RISK_FLAG_TYPES.SHARED_WITHDRAWAL_ADDRESS,
          severity: RISK_FLAG_SEVERITIES.HIGH,
          score: 45,
          reason: "La misma wallet de retiro está siendo usada por múltiples usuarios.",
          sourceType: "WithdrawalRequest",
          sourceId: withdrawal._id,
          metadata: {
            destinationAddress: withdrawal.destinationAddress,
            distinctUserCount: usersUsingAddress.length,
            threshold: env.RISK_SHARED_WITHDRAWAL_WALLET_USER_COUNT
          }
        })
      );
    }

    const smallWithdrawalCount = await WithdrawalRequestModel.countDocuments({
      userId,
      amount: { $lte: env.RISK_SMALL_WITHDRAWAL_USDT },
      createdAt: { $gte: daysAgo(7) },
      status: { $in: [WITHDRAWAL_STATUSES.PENDING, WITHDRAWAL_STATUSES.APPROVED, WITHDRAWAL_STATUSES.REJECTED] }
    });

    if (smallWithdrawalCount >= env.RISK_SMALL_WITHDRAWAL_COUNT_7D) {
      checks.push(
        await RiskService.createOrUpdateFlag({
          userId,
          type: RISK_FLAG_TYPES.MANY_SMALL_WITHDRAWALS,
          severity: RISK_FLAG_SEVERITIES.MEDIUM,
          score: 25,
          reason: "El usuario tiene demasiados retiros pequeños en los últimos 7 días.",
          sourceType: "WithdrawalRequest",
          sourceId: withdrawal._id,
          metadata: {
            smallWithdrawalCount,
            maxSmallWithdrawalAmountUSDT: env.RISK_SMALL_WITHDRAWAL_USDT,
            threshold: env.RISK_SMALL_WITHDRAWAL_COUNT_7D,
            windowDays: 7
          }
        })
      );
    }

    await RiskService.recalculateUserRisk(userId);
    return checks;
  }

  static async evaluateReferralRisk(sponsorUserId: Types.ObjectId) {
    const validReferralCount24h = await ReferralPowerEventModel.countDocuments({
      sponsorUserId,
      status: REFERRAL_POWER_EVENT_STATUSES.ACTIVE,
      createdAt: { $gte: daysAgo(1) }
    });

    if (validReferralCount24h < env.RISK_REFERRAL_SPIKE_COUNT_24H) {
      await RiskService.recalculateUserRisk(sponsorUserId);
      return null;
    }

    const flag = await RiskService.createOrUpdateFlag({
      userId: sponsorUserId,
      type: RISK_FLAG_TYPES.REFERRAL_SPIKE,
      severity: RISK_FLAG_SEVERITIES.MEDIUM,
      score: 30,
      reason: "El usuario acumuló un volumen alto de referidos válidos en 24 horas.",
      sourceType: "ReferralPowerEvent",
      metadata: {
        validReferralCount24h,
        threshold: env.RISK_REFERRAL_SPIKE_COUNT_24H,
        windowHours: 24
      }
    });

    return flag;
  }

  static async evaluateUser(userId: Types.ObjectId | string) {
    const user = await UserModel.findById(userId);
    if (!user) throw notFound("User not found", "USER_NOT_FOUND");

    const latestWithdrawal = await WithdrawalRequestModel.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (latestWithdrawal) {
      await RiskService.evaluateWithdrawal(latestWithdrawal._id);
    }

    await RiskService.evaluateReferralRisk(user._id);
    return RiskService.recalculateUserRisk(user._id);
  }

  static async getSummary() {
    const [openFlags, highRiskUsers, flagsBySeverity, flagsByType] = await Promise.all([
      RiskFlagModel.countDocuments({ status: RISK_FLAG_STATUSES.OPEN }),
      UserModel.countDocuments({ riskFlagged: true }),
      RiskFlagModel.aggregate([
        { $match: { status: RISK_FLAG_STATUSES.OPEN } },
        { $group: { _id: "$severity", count: { $sum: 1 } } }
      ]),
      RiskFlagModel.aggregate([
        { $match: { status: RISK_FLAG_STATUSES.OPEN } },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ])
    ]);

    return {
      openFlags,
      highRiskUsers,
      flagsBySeverity,
      flagsByType,
      thresholds: {
        sharedWithdrawalWalletUserCount: env.RISK_SHARED_WITHDRAWAL_WALLET_USER_COUNT,
        smallWithdrawalUSDT: env.RISK_SMALL_WITHDRAWAL_USDT,
        smallWithdrawalCount7d: env.RISK_SMALL_WITHDRAWAL_COUNT_7D,
        referralSpikeCount24h: env.RISK_REFERRAL_SPIKE_COUNT_24H
      }
    };
  }

  static async listFlags(params: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    type?: string;
    userId?: string;
  }) {
    const page = Math.max(Number(params.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(params.limit ?? 50), 1), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.severity) filter.severity = params.severity;
    if (params.type) filter.type = params.type;
    if (params.userId) filter.userId = new Types.ObjectId(params.userId);

    const [items, total] = await Promise.all([
      RiskFlagModel.find(filter)
        .sort({ status: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "telegramId telegramUsername phoneNumber riskLevel riskScore riskFlagsCount status"),
      RiskFlagModel.countDocuments(filter)
    ]);

    return {
      items,
      page,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getFlag(flagId: string) {
    const flag = await RiskFlagModel.findById(flagId).populate(
      "userId",
      "telegramId telegramUsername phoneNumber riskLevel riskScore riskFlagsCount status"
    );

    if (!flag) throw notFound("Risk flag not found", "RISK_FLAG_NOT_FOUND");
    return flag;
  }

  static async resolveFlag(params: {
    adminId: Types.ObjectId;
    flagId: string;
    status: typeof RISK_FLAG_STATUSES.RESOLVED | typeof RISK_FLAG_STATUSES.IGNORED;
    note: string;
  }) {
    const note = params.note.trim();
    if (!note) throw badRequest("Resolution note is required", "RISK_RESOLUTION_NOTE_REQUIRED");

    const flag = await RiskFlagModel.findById(params.flagId);
    if (!flag) throw notFound("Risk flag not found", "RISK_FLAG_NOT_FOUND");

    flag.status = params.status;
    flag.resolvedByAdminId = params.adminId;
    flag.resolutionNote = note;
    flag.resolvedAt = new Date();
    await flag.save();

    await RiskService.recalculateUserRisk(flag.userId as Types.ObjectId);

    await AuditService.log({
      actor: { type: AUDIT_ACTOR_TYPES.ADMIN, userId: params.adminId },
      action: AUDIT_ACTIONS.RISK_FLAG_RESOLVED,
      targetType: "RiskFlag",
      targetId: flag._id,
      after: { status: flag.status, resolutionNote: note },
      metadata: { userId: flag.userId.toString(), type: flag.type }
    });

    return flag;
  }
}
