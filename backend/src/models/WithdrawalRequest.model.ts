import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const WITHDRAWAL_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED"
} as const;

const withdrawalRequestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    amount: {
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

    destinationAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUSES),
      required: true,
      default: WITHDRAWAL_STATUSES.PENDING,
      index: true
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    adminTxHash: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },

    adminNote: {
      type: String,
      trim: true,
      default: ""
    },

    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },

    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

withdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1, requestedAt: 1 });
withdrawalRequestSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: WITHDRAWAL_STATUSES.PENDING }
  }
);
withdrawalRequestSchema.index(
  { adminTxHash: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { adminTxHash: { $type: "string" } }
  }
);

export type WithdrawalRequest = InferSchemaType<typeof withdrawalRequestSchema> & {
  _id: Types.ObjectId;
};

export const WithdrawalRequestModel = model(
  "WithdrawalRequest",
  withdrawalRequestSchema
);
