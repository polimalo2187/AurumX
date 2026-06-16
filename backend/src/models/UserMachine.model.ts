import { Schema, model, type InferSchemaType, Types } from "mongoose";
import { MACHINE_TYPES } from "../config/constants";

export const USER_MACHINE_SOURCE_TYPES = {
  FREE_CLAIM: "FREE_CLAIM",
  PAID_DEPOSIT: "PAID_DEPOSIT",
  REFERRAL_REWARD: "REFERRAL_REWARD"
} as const;

export const USER_MACHINE_STATUSES = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

const userMachineSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    machinePlanId: {
      type: Schema.Types.ObjectId,
      ref: "MachinePlan",
      required: true,
      index: true
    },

    sourceType: {
      type: String,
      enum: Object.values(USER_MACHINE_SOURCE_TYPES),
      required: true,
      index: true
    },

    depositOrderId: {
      type: Schema.Types.ObjectId,
      ref: "DepositOrder",
      default: null,
      index: true
    },

    referralRewardClaimId: {
      type: Schema.Types.ObjectId,
      ref: "ReferralRewardClaim",
      default: null,
      index: true
    },

    machineType: {
      type: String,
      enum: Object.values(MACHINE_TYPES),
      required: true,
      index: true
    },

    principalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    payoutMultiplier: {
      type: Number,
      required: true,
      min: 1
    },

    maxPayoutAmount: {
      type: Number,
      required: true,
      min: 0
    },

    durationCycles: {
      type: Number,
      required: true,
      min: 1
    },

    cycleHours: {
      type: Number,
      required: true,
      min: 1
    },

    baseCycleRewardAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    paidCycles: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: Object.values(USER_MACHINE_STATUSES),
      required: true,
      default: USER_MACHINE_STATUSES.ACTIVE,
      index: true
    },

    activatedAt: {
      type: Date,
      required: true,
      index: true
    },

    lastRewardAt: {
      type: Date,
      required: true
    },

    nextRewardAt: {
      type: Date,
      default: null,
      index: true
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userMachineSchema.index({ status: 1, nextRewardAt: 1 });
userMachineSchema.index({ userId: 1, status: 1, createdAt: -1 });
userMachineSchema.index({ userId: 1, machineType: 1, createdAt: -1 });

export type UserMachine = InferSchemaType<typeof userMachineSchema> & {
  _id: Types.ObjectId;
};

export const UserMachineModel = model("UserMachine", userMachineSchema);
