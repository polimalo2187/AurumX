import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const REFERRAL_REWARD_CLAIM_STATUSES = {
  CLAIMED: "CLAIMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

const referralRewardClaimSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    requiredExtraReferrals: {
      type: Number,
      required: true,
      min: 1
    },

    usedReferralCount: {
      type: Number,
      required: true,
      min: 1
    },

    rewardMachinePlanId: {
      type: Schema.Types.ObjectId,
      ref: "MachinePlan",
      required: true,
      index: true
    },

    userMachineId: {
      type: Schema.Types.ObjectId,
      ref: "UserMachine",
      default: null,
      index: true
    },

    status: {
      type: String,
      enum: Object.values(REFERRAL_REWARD_CLAIM_STATUSES),
      required: true,
      default: REFERRAL_REWARD_CLAIM_STATUSES.CLAIMED,
      index: true
    },

    claimedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

referralRewardClaimSchema.index({ userId: 1, createdAt: -1 });
referralRewardClaimSchema.index({ userId: 1, status: 1 });

export type ReferralRewardClaim = InferSchemaType<typeof referralRewardClaimSchema> & {
  _id: Types.ObjectId;
};

export const ReferralRewardClaimModel = model("ReferralRewardClaim", referralRewardClaimSchema);
