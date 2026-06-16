import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN"
} as const;

export const USER_STATUSES = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED"
} as const;

const userSchema = new Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },

    telegramUsername: {
      type: String,
      trim: true,
      default: ""
    },

    firstName: {
      type: String,
      trim: true,
      default: ""
    },

    lastName: {
      type: String,
      trim: true,
      default: ""
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },

    phoneVerified: {
      type: Boolean,
      required: true,
      default: false
    },

    referralCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },

    referredByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    validReferralCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    activePowerPercent: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 30
    },

    rewardReferralUsedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    claimedRewardMachineCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
      default: USER_ROLES.USER,
      index: true
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      required: true,
      default: USER_STATUSES.ACTIVE,
      index: true
    },

    lastWithdrawalRequestedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ referredByUserId: 1, createdAt: -1 });

export type User = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const UserModel = model("User", userSchema);
