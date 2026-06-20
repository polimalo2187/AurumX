import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const DEPOSIT_ORDER_STATUSES = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  HASH_SUBMITTED: "HASH_SUBMITTED",
  VERIFYING: "VERIFYING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  NEEDS_REVIEW: "NEEDS_REVIEW"
} as const;

const depositOrderSchema = new Schema(
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

    expectedAmountUSDT: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      required: true,
      default: "USDT"
    },

    network: {
      type: String,
      required: true,
      default: "BSC"
    },

    tokenStandard: {
      type: String,
      required: true,
      default: "BEP20"
    },

    depositAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },

    userSubmittedTxHash: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },

    status: {
      type: String,
      enum: Object.values(DEPOSIT_ORDER_STATUSES),
      required: true,
      default: DEPOSIT_ORDER_STATUSES.PENDING_PAYMENT,
      index: true
    },

    verificationStatus: {
      type: String,
      default: null
    },

    verificationResult: {
      type: Schema.Types.Mixed,
      default: null
    },

    confirmedAmountUSDT: {
      type: Number,
      default: null,
      min: 0
    },

    rejectionReason: {
      type: String,
      default: ""
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    submittedAt: {
      type: Date,
      default: null
    },

    confirmedAt: {
      type: Date,
      default: null
    },

    rejectedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

depositOrderSchema.index(
  { userSubmittedTxHash: 1 },
  { unique: true, sparse: true, partialFilterExpression: { userSubmittedTxHash: { $type: "string" } } }
);
depositOrderSchema.index({ userId: 1, createdAt: -1 });
depositOrderSchema.index({ status: 1, createdAt: -1 });

export type DepositOrder = InferSchemaType<typeof depositOrderSchema> & {
  _id: Types.ObjectId;
};

export const DepositOrderModel = model("DepositOrder", depositOrderSchema);
