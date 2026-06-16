import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const WALLET_TRANSACTION_TYPES = {
  MACHINE_REWARD: "MACHINE_REWARD",
  FREE_MACHINE_REWARD: "FREE_MACHINE_REWARD",
  REWARD_MACHINE_REWARD: "REWARD_MACHINE_REWARD",
  WITHDRAWAL_LOCK: "WITHDRAWAL_LOCK",
  WITHDRAWAL_APPROVED: "WITHDRAWAL_APPROVED",
  WITHDRAWAL_REJECTED: "WITHDRAWAL_REJECTED",
  ADMIN_ADJUSTMENT: "ADMIN_ADJUSTMENT"
} as const;

export const WALLET_TRANSACTION_DIRECTIONS = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT"
} as const;

export const WALLET_TRANSACTION_STATUSES = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED"
} as const;

export const WALLET_REFERENCE_TYPES = {
  USER_MACHINE: "USER_MACHINE",
  WITHDRAWAL_REQUEST: "WITHDRAWAL_REQUEST",
  ADMIN_ACTION: "ADMIN_ACTION",
  SYSTEM: "SYSTEM"
} as const;

const walletTransactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: Object.values(WALLET_TRANSACTION_TYPES),
      required: true,
      index: true
    },

    direction: {
      type: String,
      enum: Object.values(WALLET_TRANSACTION_DIRECTIONS),
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      required: true,
      default: "USDT"
    },

    status: {
      type: String,
      enum: Object.values(WALLET_TRANSACTION_STATUSES),
      required: true,
      default: WALLET_TRANSACTION_STATUSES.COMPLETED,
      index: true
    },

    referenceType: {
      type: String,
      enum: Object.values(WALLET_REFERENCE_TYPES),
      required: true,
      index: true
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
      index: true
    },

    balanceBefore: {
      type: Number,
      required: true,
      min: 0
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ referenceType: 1, referenceId: 1 });

export type WalletTransaction = InferSchemaType<typeof walletTransactionSchema> & {
  _id: Types.ObjectId;
};

export const WalletTransactionModel = model(
  "WalletTransaction",
  walletTransactionSchema
);
