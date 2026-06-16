import mongoose, { Types } from "mongoose";
import { SYSTEM_RULES } from "../../config/constants";
import { UserModel } from "../../models/User.model";
import {
  WithdrawalRequestModel,
  WITHDRAWAL_STATUSES
} from "../../models/WithdrawalRequest.model";
import { WALLET_REFERENCE_TYPES } from "../../models/WalletTransaction.model";
import { addHours } from "../../utils/dates";
import { badRequest, conflict, notFound } from "../../utils/errors";
import { assertPositiveAmount, roundUSDT } from "../../utils/money";
import { normalizeBscAddress } from "../../utils/bsc-address";
import { normalizeTxHash } from "../../utils/tx-hash";
import { WalletService } from "../wallet/wallet.service";

export class WithdrawalService {
  static async requestWithdrawal(params: {
    userId: Types.ObjectId;
    amount: number;
    destinationAddress: string;
  }) {
    const amount = roundUSDT(params.amount);
    assertPositiveAmount(amount);

    if (amount < SYSTEM_RULES.MIN_WITHDRAWAL_USDT) {
      throw badRequest(
        `Minimum withdrawal is ${SYSTEM_RULES.MIN_WITHDRAWAL_USDT} USDT`,
        "MIN_WITHDRAWAL_NOT_REACHED"
      );
    }

    const destinationAddress = normalizeBscAddress(params.destinationAddress);
    const session = await mongoose.startSession();

    try {
      let createdWithdrawalId: Types.ObjectId | null = null;

      await session.withTransaction(async () => {
        const user = await UserModel.findById(params.userId).session(session);

        if (!user) {
          throw notFound("User not found", "USER_NOT_FOUND");
        }

        if (user.lastWithdrawalRequestedAt) {
          const nextAllowedAt = addHours(
            user.lastWithdrawalRequestedAt,
            SYSTEM_RULES.WITHDRAWAL_COOLDOWN_HOURS
          );

          if (nextAllowedAt.getTime() > Date.now()) {
            throw conflict("Only one withdrawal request is allowed every 24 hours", "WITHDRAWAL_COOLDOWN_ACTIVE", {
              nextAllowedAt
            });
          }
        }

        const pendingWithdrawal = await WithdrawalRequestModel.exists({
          userId: params.userId,
          status: WITHDRAWAL_STATUSES.PENDING
        }).session(session);

        if (pendingWithdrawal) {
          throw conflict("You already have a pending withdrawal", "PENDING_WITHDRAWAL_EXISTS");
        }

        const withdrawalId = new Types.ObjectId();
        createdWithdrawalId = withdrawalId;

        await WalletService.lockForWithdrawal({
          userId: params.userId,
          amount,
          reference: {
            type: WALLET_REFERENCE_TYPES.WITHDRAWAL_REQUEST,
            id: withdrawalId
          },
          session
        });

        await WithdrawalRequestModel.create(
          [
            {
              _id: withdrawalId,
              userId: params.userId,
              amount,
              currency: SYSTEM_RULES.CURRENCY,
              network: SYSTEM_RULES.NETWORK,
              tokenStandard: SYSTEM_RULES.TOKEN_STANDARD,
              destinationAddress,
              status: WITHDRAWAL_STATUSES.PENDING,
              requestedAt: new Date()
            }
          ],
          { session }
        );

        user.lastWithdrawalRequestedAt = new Date();
        await user.save({ session });
      });

      if (!createdWithdrawalId) {
        throw new Error("Failed to create withdrawal request");
      }

      return WithdrawalRequestModel.findById(createdWithdrawalId);
    } finally {
      await session.endSession();
    }
  }

  static async getUserWithdrawals(userId: Types.ObjectId, params?: { page?: number; limit?: number }) {
    const page = Math.max(Number(params?.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(params?.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      WithdrawalRequestModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WithdrawalRequestModel.countDocuments({ userId })
    ]);

    return {
      items,
      page,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getPendingWithdrawals(params?: { page?: number; limit?: number }) {
    const page = Math.max(Number(params?.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(params?.limit ?? 50), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      WithdrawalRequestModel.find({ status: WITHDRAWAL_STATUSES.PENDING })
        .sort({ requestedAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "telegramId telegramUsername phoneNumber firstName lastName"),
      WithdrawalRequestModel.countDocuments({ status: WITHDRAWAL_STATUSES.PENDING })
    ]);

    return {
      items,
      page,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async approveWithdrawal(params: {
    adminId: Types.ObjectId;
    withdrawalId: string;
    adminTxHash: string;
    adminNote?: string;
  }) {
    const adminTxHash = normalizeTxHash(params.adminTxHash);
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const existingHash = await WithdrawalRequestModel.exists({
          adminTxHash,
          _id: { $ne: params.withdrawalId }
        }).session(session);

        if (existingHash) {
          throw conflict("This payout hash was already used", "WITHDRAWAL_TX_HASH_ALREADY_USED");
        }

        const withdrawal = await WithdrawalRequestModel.findById(params.withdrawalId).session(session);

        if (!withdrawal) {
          throw notFound("Withdrawal request not found", "WITHDRAWAL_NOT_FOUND");
        }

        if (withdrawal.status !== WITHDRAWAL_STATUSES.PENDING) {
          throw conflict("Withdrawal is not pending", "WITHDRAWAL_NOT_PENDING");
        }

        await WalletService.approveLockedWithdrawal({
          userId: withdrawal.userId as Types.ObjectId,
          amount: withdrawal.amount,
          reference: {
            type: WALLET_REFERENCE_TYPES.WITHDRAWAL_REQUEST,
            id: withdrawal._id
          },
          metadata: {
            adminTxHash,
            adminId: params.adminId.toString()
          },
          session
        });

        withdrawal.status = WITHDRAWAL_STATUSES.APPROVED;
        withdrawal.adminId = params.adminId;
        withdrawal.adminTxHash = adminTxHash;
        withdrawal.adminNote = params.adminNote ?? "";
        withdrawal.reviewedAt = new Date();
        await withdrawal.save({ session });
      });

      return WithdrawalRequestModel.findById(params.withdrawalId);
    } finally {
      await session.endSession();
    }
  }

  static async rejectWithdrawal(params: {
    adminId: Types.ObjectId;
    withdrawalId: string;
    adminNote: string;
  }) {
    const note = params.adminNote.trim();

    if (!note) {
      throw badRequest("Admin note is required", "ADMIN_NOTE_REQUIRED");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const withdrawal = await WithdrawalRequestModel.findById(params.withdrawalId).session(session);

        if (!withdrawal) {
          throw notFound("Withdrawal request not found", "WITHDRAWAL_NOT_FOUND");
        }

        if (withdrawal.status !== WITHDRAWAL_STATUSES.PENDING) {
          throw conflict("Withdrawal is not pending", "WITHDRAWAL_NOT_PENDING");
        }

        await WalletService.rejectLockedWithdrawal({
          userId: withdrawal.userId as Types.ObjectId,
          amount: withdrawal.amount,
          reference: {
            type: WALLET_REFERENCE_TYPES.WITHDRAWAL_REQUEST,
            id: withdrawal._id
          },
          metadata: {
            adminId: params.adminId.toString(),
            adminNote: note
          },
          session
        });

        withdrawal.status = WITHDRAWAL_STATUSES.REJECTED;
        withdrawal.adminId = params.adminId;
        withdrawal.adminNote = note;
        withdrawal.reviewedAt = new Date();
        await withdrawal.save({ session });
      });

      return WithdrawalRequestModel.findById(params.withdrawalId);
    } finally {
      await session.endSession();
    }
  }
}
