import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const TELEGRAM_LOGIN_SESSION_STATUSES = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  CONSUMED: "CONSUMED",
  EXPIRED: "EXPIRED"
} as const;

const telegramLoginSessionSchema = new Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    status: {
      type: String,
      enum: Object.values(TELEGRAM_LOGIN_SESSION_STATUSES),
      required: true,
      default: TELEGRAM_LOGIN_SESSION_STATUSES.PENDING,
      index: true
    },

    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },

    telegramId: {
      type: String,
      trim: true,
      default: "",
      index: true
    },

    chatId: {
      type: String,
      trim: true,
      default: "",
      index: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    expectedPhoneNumber: {
      type: String,
      trim: true,
      default: "",
      index: true
    },

    purpose: {
      type: String,
      trim: true,
      default: "LOGIN",
      index: true
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    consumedAt: {
      type: Date,
      default: null
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

telegramLoginSessionSchema.index({ status: 1, expiresAt: 1 });

export type TelegramLoginSession = InferSchemaType<typeof telegramLoginSessionSchema> & {
  _id: Types.ObjectId;
};

export const TelegramLoginSessionModel = model("TelegramLoginSession", telegramLoginSessionSchema);
