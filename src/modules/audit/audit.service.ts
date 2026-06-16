import type { ClientSession, Types } from "mongoose";
import { AuditLogModel, AUDIT_ACTOR_TYPES } from "../../models/AuditLog.model";

export type AuditActor = {
  type: (typeof AUDIT_ACTOR_TYPES)[keyof typeof AUDIT_ACTOR_TYPES];
  userId?: Types.ObjectId | null;
};

export class AuditService {
  static async log(params: {
    actor: AuditActor;
    action: string;
    targetType: string;
    targetId?: Types.ObjectId | null;
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown> | null;
    ip?: string;
    userAgent?: string;
    session?: ClientSession;
  }) {
    const [log] = await AuditLogModel.create(
      [
        {
          actorType: params.actor.type,
          actorUserId: params.actor.userId ?? null,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId ?? null,
          before: params.before ?? null,
          after: params.after ?? null,
          metadata: params.metadata ?? null,
          ip: params.ip ?? "",
          userAgent: params.userAgent ?? ""
        }
      ],
      { session: params.session }
    );

    return log;
  }

  static async list(params?: {
    page?: number;
    limit?: number;
    actorUserId?: string;
    targetType?: string;
    targetId?: string;
    action?: string;
    from?: Date;
    to?: Date;
  }) {
    const page = Math.max(Number(params?.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(params?.limit ?? 50), 1), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (params?.actorUserId) filter.actorUserId = params.actorUserId;
    if (params?.targetType) filter.targetType = params.targetType;
    if (params?.targetId) filter.targetId = params.targetId;
    if (params?.action) filter.action = params.action;
    if (params?.from || params?.to) {
      filter.createdAt = {
        ...(params.from ? { $gte: params.from } : {}),
        ...(params.to ? { $lte: params.to } : {})
      };
    }

    const [items, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actorUserId", "telegramId telegramUsername phoneNumber role"),
      AuditLogModel.countDocuments(filter)
    ]);

    return {
      items,
      page,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
}
