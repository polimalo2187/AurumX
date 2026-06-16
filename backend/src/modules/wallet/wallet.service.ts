import type { ClientSession, Types } from "mongoose";
import { WalletModel } from "../../models/Wallet.model";
import {
  WalletTransactionModel,
  WALLET_TRANSACTION_DIRECTIONS,
  WALLET_TRANSACTION_STATUSES,
  type WALLET_REFERENCE_TYPES,
  type WALLET_TRANSACTION_TYPES
} from "../../models/WalletTransaction.model";
import { badRequest, notFound } from "../../utils/errors";
import { assertPositiveAmount, roundUSDT } from "../../utils/money";

export type WalletReference = {
  type: (typeof WALLET_REFERENCE_TYPES)[keyof typeof WALLET_REFERENCE_TYPES];
  id?: Types.ObjectId;
};

export class WalletService {
  static async createWalletForUser(userId: Types.ObjectId, session?: ClientSession) {
    const existing = await WalletModel.findOne({ userId }).session(session ?? null);

    if (existing) {
      return existing;
    }

    const [wallet] = await WalletModel.create(
      [
        {
          userId,
          availableUSDT: 0,
          lockedUSDT: 0
        }
      ],
      { session }
    );

    return wallet;
  }

  static async getWalletOrFail(userId: Types.ObjectId) {
    const wallet = await WalletModel.findOne({ userId });

    if (!wallet) {
      throw notFound("Wallet not found", "WALLET_NOT_FOUND");
    }

    return wallet;
  }

  static async credit(params: {
    userId: Types.ObjectId;
    amount: number;
    type: (typeof WALLET_TRANSACTION_TYPES)[keyof typeof WALLET_TRANSACTION_TYPES];
    reference: WalletReference;
    metadata?: Record<string, unknown>;
    session?: ClientSession;
  }) {
    assertPositiveAmount(params.amount);

    const wallet = await WalletModel.findOne({ userId: params.userId }).session(
      params.session ?? null
    );

    if (!wallet) {
      throw notFound("Wallet not found", "WALLET_NOT_FOUND");
    }

    const amount = roundUSDT(params.amount);
    const balanceBefore = roundUSDT(wallet.availableUSDT);
    const balanceAfter = roundUSDT(balanceBefore + amount);

    wallet.availableUSDT = balanceAfter;
    await wallet.save({ session: params.session });

    const [transaction] = await WalletTransactionModel.create(
      [
        {
          userId: params.userId,
          type: params.type,
          direction: WALLET_TRANSACTION_DIRECTIONS.CREDIT,
          amount,
          currency: "USDT",
          status: WALLET_TRANSACTION_STATUSES.COMPLETED,
          referenceType: params.reference.type,
          referenceId: params.reference.id ?? null,
          balanceBefore,
          balanceAfter,
          metadata: params.metadata ?? null
        }
      ],
      { session: params.session }
    );

    return { wallet, transaction };
  }

  static async lockForWithdrawal(params: {
    userId: Types.ObjectId;
    amount: number;
    reference: WalletReference;
    session?: ClientSession;
  }) {
    assertPositiveAmount(params.amount);

    const wallet = await WalletModel.findOne({ userId: params.userId }).session(
      params.session ?? null
    );

    if (!wallet) {
      throw notFound("Wallet not found", "WALLET_NOT_FOUND");
    }

    const amount = roundUSDT(params.amount);

    if (wallet.availableUSDT < amount) {
      throw badRequest("Insufficient available balance", "INSUFFICIENT_BALANCE");
    }

    const balanceBefore = roundUSDT(wallet.availableUSDT);
    const balanceAfter = roundUSDT(balanceBefore - amount);

    wallet.availableUSDT = balanceAfter;
    wallet.lockedUSDT = roundUSDT(wallet.lockedUSDT + amount);
    await wallet.save({ session: params.session });

    const [transaction] = await WalletTransactionModel.create(
      [
        {
          userId: params.userId,
          type: "WITHDRAWAL_LOCK",
          direction: WALLET_TRANSACTION_DIRECTIONS.DEBIT,
          amount,
          currency: "USDT",
          status: WALLET_TRANSACTION_STATUSES.COMPLETED,
          referenceType: params.reference.type,
          referenceId: params.reference.id ?? null,
          balanceBefore,
          balanceAfter
        }
      ],
      { session: params.session }
    );

    return { wallet, transaction };
  }
}
