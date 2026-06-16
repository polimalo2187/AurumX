import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const AUDIT_ACTIONS = {
  USER_BLOCKED: "USER_BLOCKED",
  USER_UNBLOCKED: "USER_UNBLOCKED",
  DEPOSIT_RETRY_VERIFICATION: "DEPOSIT_RETRY_VERIFICATION",
  DEPOSIT_ADMIN_REJECTED: "DEPOSIT_ADMIN_REJECTED",
  WITHDRAWAL_APPROVED: "WITHDRAWAL_APPROVED",
  WITHDRAWAL_REJECTED: "WITHDRAWAL_REJECTED",
  ADMIN_VIEWED_DASHBOARD: "ADMIN_VIEWED_DASHBOARD"
} as const;

export const AUDIT_ACTOR_TYPES = {
  USER: "USER",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM"
} as const;

const auditLogSchema = new Schema(
  {
    actorType: {
      type: String,
      enum: Object.values(AUDIT_ACTOR_TYPES),
      required: true,
      index: true
    },

    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    targetType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true
    },

    before: {
      type: Schema.Types.Mixed,
      default: null
    },

    after: {
      type: Schema.Types.Mixed,
      default: null
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null
    },

    ip: {
      type: String,
      default: ""
    },

    userAgent: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export type AuditLog = InferSchemaType<typeof auditLogSchema> & { _id: Types.ObjectId };

export const AuditLogModel = model("AuditLog", auditLogSchema);
