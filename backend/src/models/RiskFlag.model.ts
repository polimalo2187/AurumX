import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const RISK_FLAG_TYPES = {
  SHARED_WITHDRAWAL_ADDRESS: "SHARED_WITHDRAWAL_ADDRESS",
  MANY_SMALL_WITHDRAWALS: "MANY_SMALL_WITHDRAWALS",
  REFERRAL_SPIKE: "REFERRAL_SPIKE",
  MANUAL_REVIEW: "MANUAL_REVIEW"
} as const;

export const RISK_FLAG_SEVERITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
} as const;

export const RISK_FLAG_STATUSES = {
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  IGNORED: "IGNORED"
} as const;

const riskFlagSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: Object.values(RISK_FLAG_TYPES),
      required: true,
      index: true
    },

    severity: {
      type: String,
      enum: Object.values(RISK_FLAG_SEVERITIES),
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: Object.values(RISK_FLAG_STATUSES),
      required: true,
      default: RISK_FLAG_STATUSES.OPEN,
      index: true
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    sourceType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    sourceId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null
    },

    resolvedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    resolutionNote: {
      type: String,
      trim: true,
      default: ""
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

riskFlagSchema.index({ status: 1, severity: 1, createdAt: -1 });
riskFlagSchema.index({ userId: 1, status: 1, createdAt: -1 });
riskFlagSchema.index({ type: 1, sourceType: 1, sourceId: 1 });
riskFlagSchema.index(
  { userId: 1, type: 1, sourceType: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: RISK_FLAG_STATUSES.OPEN }
  }
);

export type RiskFlag = InferSchemaType<typeof riskFlagSchema> & { _id: Types.ObjectId };

export const RiskFlagModel = model("RiskFlag", riskFlagSchema);
