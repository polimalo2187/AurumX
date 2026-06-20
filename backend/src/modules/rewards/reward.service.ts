import mongoose, { type Types } from "mongoose";
import { MACHINE_TYPES, SYSTEM_RULES } from "../../config/constants";
import {
  MachineRewardLogModel,
  MACHINE_REWARD_LOG_STATUSES
} from "../../models/MachineRewardLog.model";
import { UserModel } from "../../models/User.model";
import {
  UserMachineModel,
  USER_MACHINE_SOURCE_TYPES,
  USER_MACHINE_STATUSES,
  type UserMachine
} from "../../models/UserMachine.model";
import {
  WALLET_REFERENCE_TYPES,
  WALLET_TRANSACTION_TYPES
} from "../../models/WalletTransaction.model";
import { addHours } from "../../utils/dates";
import { notFound } from "../../utils/errors";
import { roundUSDT } from "../../utils/money";
import { calculateMachineReward } from "../../utils/economics";
import { WalletService } from "../wallet/wallet.service";

export type RewardCalculation = {
  powerPercentApplied: number;
  baseRewardAmount: number;
  effectiveRewardAmount: number;
  remainingAmount: number;
  rewardToPay: number;
};

export type ProcessRewardResult = {
  processed: boolean;
  skippedReason?: string;
  machineId: string;
  rewardAmount?: number;
  completed?: boolean;
};

function getWalletTransactionType(machineType: string) {
  if (machineType === MACHINE_TYPES.FREE) {
    return WALLET_TRANSACTION_TYPES.FREE_MACHINE_REWARD;
  }

  if (machineType === MACHINE_TYPES.REWARD) {
    return WALLET_TRANSACTION_TYPES.REWARD_MACHINE_REWARD;
  }

  return WALLET_TRANSACTION_TYPES.MACHINE_REWARD;
}

export class RewardService {
  static calculateReward(machine: UserMachine, activePowerPercent: number): RewardCalculation {
    return calculateMachineReward(machine, activePowerPercent);
  }

  static async runDueRewards(limit = 500): Promise<{
    scanned: number;
    processed: number;
    skipped: number;
    completed: number;
    results: ProcessRewardResult[];
  }> {
    const now = new Date();
    const machines = await UserMachineModel.find({
      status: USER_MACHINE_STATUSES.ACTIVE,
      nextRewardAt: { $lte: now }
    })
      .sort({ nextRewardAt: 1 })
      .limit(limit);

    const results: ProcessRewardResult[] = [];

    for (const machine of machines) {
      const result = await RewardService.processMachineReward(machine._id);
      results.push(result);
    }

    return {
      scanned: machines.length,
      processed: results.filter((result) => result.processed).length,
      skipped: results.filter((result) => !result.processed).length,
      completed: results.filter((result) => result.completed).length,
      results
    };
  }

  static async processMachineReward(userMachineId: Types.ObjectId | string): Promise<ProcessRewardResult> {
    const session = await mongoose.startSession();

    try {
      let result: ProcessRewardResult = {
        processed: false,
        machineId: userMachineId.toString(),
        skippedReason: "NOT_PROCESSED"
      };

      await session.withTransaction(async () => {
        const machine = await UserMachineModel.findById(userMachineId).session(session);

        if (!machine) {
          throw notFound("User machine not found", "USER_MACHINE_NOT_FOUND");
        }

        result.machineId = machine._id.toString();

        if (machine.status !== USER_MACHINE_STATUSES.ACTIVE) {
          result = {
            processed: false,
            machineId: machine._id.toString(),
            skippedReason: "MACHINE_NOT_ACTIVE"
          };
          return;
        }

        if (!machine.nextRewardAt || machine.nextRewardAt.getTime() > Date.now()) {
          result = {
            processed: false,
            machineId: machine._id.toString(),
            skippedReason: "REWARD_NOT_DUE"
          };
          return;
        }

        if (machine.sourceType === USER_MACHINE_SOURCE_TYPES.FREE_CLAIM) {
          const canonicalFreeMachine = await UserMachineModel.findOne({
            userId: machine.userId,
            sourceType: USER_MACHINE_SOURCE_TYPES.FREE_CLAIM,
            status: { $ne: USER_MACHINE_STATUSES.CANCELLED }
          })
            .sort({ activatedAt: 1, createdAt: 1 })
            .session(session);

          if (canonicalFreeMachine && !canonicalFreeMachine._id.equals(machine._id)) {
            machine.status = USER_MACHINE_STATUSES.CANCELLED;
            machine.completedAt = new Date();
            machine.nextRewardAt = null;
            await machine.save({ session });

            result = {
              processed: false,
              machineId: machine._id.toString(),
              skippedReason: "DUPLICATE_FREE_MACHINE_CANCELLED"
            };
            return;
          }
        }

        const cycleNumber = machine.paidCycles + 1;

        const existingLog = await MachineRewardLogModel.findOne({
          userMachineId: machine._id,
          cycleNumber
        }).session(session);

        if (existingLog) {
          result = {
            processed: false,
            machineId: machine._id.toString(),
            skippedReason: "CYCLE_ALREADY_PAID"
          };
          return;
        }

        const user = await UserModel.findById(machine.userId).session(session);

        if (!user) {
          throw notFound("User not found", "USER_NOT_FOUND");
        }

        const calculation = RewardService.calculateReward(machine, user.activePowerPercent);

        if (calculation.rewardToPay <= 0) {
          machine.status = USER_MACHINE_STATUSES.COMPLETED;
          machine.completedAt = new Date();
          machine.nextRewardAt = null;
          await machine.save({ session });

          result = {
            processed: false,
            machineId: machine._id.toString(),
            skippedReason: "NO_REMAINING_PAYOUT",
            completed: true
          };
          return;
        }

        const [rewardLog] = await MachineRewardLogModel.create(
          [
            {
              userId: machine.userId,
              userMachineId: machine._id,
              cycleNumber,
              rewardAmount: calculation.rewardToPay,
              currency: SYSTEM_RULES.CURRENCY,
              powerPercentApplied: calculation.powerPercentApplied,
              rewardFrom: machine.lastRewardAt,
              rewardTo: machine.nextRewardAt,
              status: MACHINE_REWARD_LOG_STATUSES.PAID
            }
          ],
          { session }
        );

        if (!rewardLog) {
          throw new Error("Failed to create reward log");
        }

        const walletResult = await WalletService.credit({
          userId: machine.userId,
          amount: calculation.rewardToPay,
          type: getWalletTransactionType(machine.machineType),
          reference: {
            type: WALLET_REFERENCE_TYPES.USER_MACHINE,
            id: machine._id
          },
          metadata: {
            cycleNumber,
            userMachineId: machine._id.toString(),
            machineType: machine.machineType,
            powerPercentApplied: calculation.powerPercentApplied,
            baseRewardAmount: calculation.baseRewardAmount,
            effectiveRewardAmount: calculation.effectiveRewardAmount
          },
          session
        });

        if (!walletResult.transaction) {
          throw new Error("Failed to create wallet transaction");
        }

        rewardLog.walletTransactionId = walletResult.transaction._id;
        await rewardLog.save({ session });

        const newPaidAmount = roundUSDT(machine.paidAmount + calculation.rewardToPay);
        machine.paidAmount = Math.min(newPaidAmount, machine.maxPayoutAmount);
        machine.paidCycles = cycleNumber;
        machine.lastRewardAt = machine.nextRewardAt;

        const completed = machine.paidAmount >= machine.maxPayoutAmount;

        if (completed) {
          machine.status = USER_MACHINE_STATUSES.COMPLETED;
          machine.completedAt = new Date();
          machine.nextRewardAt = null;
        } else {
          machine.nextRewardAt = addHours(machine.lastRewardAt, machine.cycleHours);
        }

        await machine.save({ session });

        result = {
          processed: true,
          machineId: machine._id.toString(),
          rewardAmount: calculation.rewardToPay,
          completed
        };
      });

      return result;
    } finally {
      await session.endSession();
    }
  }
}
