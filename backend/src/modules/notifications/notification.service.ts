import type { Types } from "mongoose";
import { UserModel } from "../../models/User.model";
import {
  NotificationModel,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  type NOTIFICATION_TYPES
} from "../../models/Notification.model";
import { AUDIT_ACTIONS, AUDIT_ACTOR_TYPES } from "../../models/AuditLog.model";
import { notFound } from "../../utils/errors";
import { AuditService } from "../audit/audit.service";
import { TelegramService } from "../telegram/telegram.service";

type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export class NotificationService {
  static async create(params: {
    userId: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    const user = await UserModel.findById(params.userId).select("telegramId");

    if (!user) {
      throw notFound("User not found", "USER_NOT_FOUND");
    }

    const [notification] = await NotificationModel.create([
      {
        userId: params.userId,
        telegramId: user.telegramId,
        channel: NOTIFICATION_CHANNELS.TELEGRAM,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata ?? null
      }
    ]);

    if (!notification) {
      throw new Error("Failed to create notification");
    }

    await AuditService.log({
      actor: { type: AUDIT_ACTOR_TYPES.SYSTEM },
      action: AUDIT_ACTIONS.NOTIFICATION_CREATED,
      targetType: "Notification",
      targetId: notification._id,
      metadata: { type: params.type, userId: params.userId.toString() }
    });

    return notification;
  }

  static async sendPending(limit = 50) {
    const notifications = await NotificationModel.find({
      status: { $in: [NOTIFICATION_STATUSES.PENDING, NOTIFICATION_STATUSES.FAILED] },
      attempts: { $lt: 5 }
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        await TelegramService.sendMessage(
          notification.telegramId,
          `${notification.title}\n\n${notification.message}`
        );

        notification.status = NOTIFICATION_STATUSES.SENT;
        notification.sentAt = new Date();
        notification.attempts += 1;
        notification.lastError = "";
        await notification.save();
        sent += 1;

        await AuditService.log({
          actor: { type: AUDIT_ACTOR_TYPES.SYSTEM },
          action: AUDIT_ACTIONS.NOTIFICATION_SENT,
          targetType: "Notification",
          targetId: notification._id
        });
      } catch (error) {
        notification.status = NOTIFICATION_STATUSES.FAILED;
        notification.attempts += 1;
        notification.lastError = error instanceof Error ? error.message : "UNKNOWN_ERROR";
        await notification.save();
        failed += 1;

        await AuditService.log({
          actor: { type: AUDIT_ACTOR_TYPES.SYSTEM },
          action: AUDIT_ACTIONS.NOTIFICATION_FAILED,
          targetType: "Notification",
          targetId: notification._id,
          metadata: { error: notification.lastError }
        });
      }
    }

    return { sent, failed, total: notifications.length };
  }
}
