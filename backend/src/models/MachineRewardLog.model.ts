import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const MACHINE_REWARD_LOG_STATUSES = {
  PAID: "PAID",
  SKIPPED: "SKIPPED",
  FAILED: "FAILED"
} as const;

const machineRewardLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    userMachineId: {
      type: Schema.Types.ObjectId,
      ref: "UserMachine",
      required: true,
      index: true
    },

    cycleNumber: {
      type: Number,
      required: true,
      min: 1
    },

    rewardAmount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      required: true,
      default: "USDT"
    },

    powerPercentApplied: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    rewardFrom: {
      type: Date,
      required: true
    },

    rewardTo: {
      type: Date,
      required: true
    },

    walletTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null,
      index: true
    },

    status: {
      type: String,
      enum: Object.values(MACHINE_REWARD_LOG_STATUSES),
      required: true,
      default: MACHINE_REWARD_LOG_STATUSES.PAID,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

machineRewardLogSchema.index({ userMachineId: 1, cycleNumber: 1 }, { unique: true });
machineRewardLogSchema.index({ userId: 1, createdAt: -1 });

export type MachineRewardLog = InferSchemaType<typeof machineRewardLogSchema> & {
  _id: Types.ObjectId;
};

export const MachineRewardLogModel = model("MachineRewardLog", machineRewardLogSchema);
