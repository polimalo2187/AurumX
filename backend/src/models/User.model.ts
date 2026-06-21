import { Schema, model, type HydratedDocument, Types } from "mongoose";

export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN"
} as const;

export const USER_STATUSES = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED"
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserStatus = typeof USER_STATUSES[keyof typeof USER_STATUSES];

export type UserFields = {
  telegramId?: string;
  username?: string;
  passwordHash: string;
  phoneCountryCode: string;
  phoneNationalNumber: string;
  phoneE164?: string;
  lastLoginAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  telegramUsername: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneVerified: boolean;
  referralCode: string;
  referredByUserId?: Types.ObjectId | null;
  validReferralCount: number;
  activePowerPercent: number;
  rewardReferralUsedCount: number;
  claimedRewardMachineCount: number;
  role: UserRole;
  status: UserStatus;
  riskFlagged: boolean;
  riskLevel: string;
  riskScore: number;
  riskFlagsCount: number;
  riskLastEvaluatedAt?: Date | null;
  lastWithdrawalRequestedAt?: Date | null;
};

const userSchema = new Schema<UserFields>(
  {
    telegramId: {
      type: String,
      trim: true,
      default: undefined
    },

    username: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined
    },

    passwordHash: {
      type: String,
      trim: true,
      default: ""
    },

    phoneCountryCode: {
      type: String,
      trim: true,
      default: ""
    },

    phoneNationalNumber: {
      type: String,
      trim: true,
      default: ""
    },

    phoneE164: {
      type: String,
      trim: true,
      default: undefined
    },

    lastLoginAt: {
      type: Date,
      default: null
    },

    phoneVerifiedAt: {
      type: Date,
      default: null
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
      trim: true
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

    riskFlagged: {
      type: Boolean,
      required: true,
      default: false,
      index: true
    },

    riskLevel: {
      type: String,
      required: true,
      default: "NONE",
      index: true
    },

    riskScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
      index: true
    },

    riskFlagsCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    riskLastEvaluatedAt: {
      type: Date,
      default: null
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

userSchema.index(
  { telegramId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { telegramId: { $type: "string" } }
  }
);
userSchema.index(
  { username: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { username: { $type: "string" } }
  }
);
userSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $type: "string" } }
  }
);
userSchema.index(
  { phoneE164: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { phoneE164: { $type: "string" } }
  }
);
userSchema.index({ role: 1, status: 1 });
userSchema.index({ riskFlagged: 1, riskScore: -1 });
userSchema.index({ referredByUserId: 1, createdAt: -1 });

export type User = HydratedDocument<UserFields> & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const UserModel = model<UserFields>("User", userSchema);
