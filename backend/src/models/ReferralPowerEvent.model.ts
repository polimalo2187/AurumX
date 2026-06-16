import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const REFERRAL_POWER_EVENT_TYPES = {
  REFERRED_FIRST_PAID_MACHINE: "REFERRED_FIRST_PAID_MACHINE"
} as const;

export const REFERRAL_POWER_EVENT_STATUSES = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED"
} as const;

const referralPowerEventSchema = new Schema(
  {
    sponsorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    sourceDepositOrderId: {
      type: Schema.Types.ObjectId,
      ref: "DepositOrder",
      required: true,
      index: true
    },

    sourceUserMachineId: {
      type: Schema.Types.ObjectId,
      ref: "UserMachine",
      required: true,
      index: true
    },

    powerPercent: {
      type: Number,
      required: true,
      min: 0
    },

    type: {
      type: String,
      enum: Object.values(REFERRAL_POWER_EVENT_TYPES),
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: Object.values(REFERRAL_POWER_EVENT_STATUSES),
      required: true,
      default: REFERRAL_POWER_EVENT_STATUSES.ACTIVE,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

referralPowerEventSchema.index(
  { sponsorUserId: 1, referredUserId: 1, type: 1 },
  { unique: true }
);
referralPowerEventSchema.index({ sponsorUserId: 1, status: 1, createdAt: -1 });

export type ReferralPowerEvent = InferSchemaType<typeof referralPowerEventSchema> & {
  _id: Types.ObjectId;
};

export const ReferralPowerEventModel = model("ReferralPowerEvent", referralPowerEventSchema);
