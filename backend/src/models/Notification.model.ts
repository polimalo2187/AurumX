import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const NOTIFICATION_TYPES = {
  TELEGRAM_VERIFIED: "TELEGRAM_VERIFIED",
  DEPOSIT_CONFIRMED: "DEPOSIT_CONFIRMED",
  DEPOSIT_REJECTED: "DEPOSIT_REJECTED",
  MACHINE_ACTIVATED: "MACHINE_ACTIVATED",
  REWARD_PAID: "REWARD_PAID",
  MACHINE_COMPLETED: "MACHINE_COMPLETED",
  WITHDRAWAL_REQUESTED: "WITHDRAWAL_REQUESTED",
  WITHDRAWAL_APPROVED: "WITHDRAWAL_APPROVED",
  WITHDRAWAL_REJECTED: "WITHDRAWAL_REJECTED",
  REFERRAL_VALIDATED: "REFERRAL_VALIDATED",
  REWARD_MACHINE_AVAILABLE: "REWARD_MACHINE_AVAILABLE"
} as const;

export const NOTIFICATION_STATUSES = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED"
} as const;

export const NOTIFICATION_CHANNELS = {
  TELEGRAM: "TELEGRAM"
} as const;

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    telegramId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      required: true,
      default: NOTIFICATION_CHANNELS.TELEGRAM,
      index: true
    },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUSES),
      required: true,
      default: NOTIFICATION_STATUSES.PENDING,
      index: true
    },

    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    lastError: {
      type: String,
      default: ""
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null
    },

    sentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

notificationSchema.index({ status: 1, createdAt: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };

export const NotificationModel = model("Notification", notificationSchema);
