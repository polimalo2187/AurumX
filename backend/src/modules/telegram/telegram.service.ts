import { createHash, randomBytes } from "crypto";
import mongoose from "mongoose";
import { env } from "../../config/env";
import { TelegramLoginSessionModel, TELEGRAM_LOGIN_SESSION_STATUSES } from "../../models/TelegramLoginSession.model";
import { AUDIT_ACTIONS, AUDIT_ACTOR_TYPES } from "../../models/AuditLog.model";
import { badRequest, forbidden, notFound } from "../../utils/errors";
import { addHours } from "../../utils/dates";
import { UserService } from "../users/user.service";
import { AuditService } from "../audit/audit.service";

const LOGIN_SESSION_TTL_HOURS = 1;

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramContact = {
  phone_number: string;
  user_id?: number;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  from?: TelegramUser;
  contact?: TelegramContact;
  chat: { id: number };
};

type TelegramWebhookPayload = {
  update_id: number;
  message?: TelegramMessage;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeReferralCode(referralCode?: string): string {
  return referralCode ? referralCode.trim().toUpperCase() : "";
}

export class TelegramService {
  static async createLoginSession(referralCode?: string) {
    if (!env.TELEGRAM_BOT_USERNAME) {
      throw badRequest("TELEGRAM_BOT_USERNAME is not configured", "TELEGRAM_BOT_NOT_CONFIGURED");
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    await TelegramLoginSessionModel.create({
      tokenHash,
      referralCode: normalizeReferralCode(referralCode),
      status: TELEGRAM_LOGIN_SESSION_STATUSES.PENDING,
      expiresAt: addHours(new Date(), LOGIN_SESSION_TTL_HOURS)
    });

    const botUrl = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=login_${rawToken}`;

    await AuditService.log({
      actor: { type: AUDIT_ACTOR_TYPES.SYSTEM },
      action: AUDIT_ACTIONS.TELEGRAM_LOGIN_SESSION_CREATED,
      targetType: "TelegramLoginSession",
      targetId: null,
      metadata: { referralCode: normalizeReferralCode(referralCode) }
    });

    return { verificationToken: rawToken, botUrl, expiresInMinutes: LOGIN_SESSION_TTL_HOURS * 60 };
  }

  static async completeLoginSession(rawToken: string) {
    const session = await TelegramLoginSessionModel.findOne({ tokenHash: hashToken(rawToken) });

    if (!session) {
      throw notFound("Telegram login session not found", "TELEGRAM_LOGIN_SESSION_NOT_FOUND");
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      session.status = TELEGRAM_LOGIN_SESSION_STATUSES.EXPIRED;
      await session.save();
      throw forbidden("Telegram login session expired", "TELEGRAM_LOGIN_SESSION_EXPIRED");
    }

    if (session.status !== TELEGRAM_LOGIN_SESSION_STATUSES.VERIFIED || !session.userId) {
      throw forbidden("Telegram phone verification is still pending", "TELEGRAM_LOGIN_NOT_VERIFIED");
    }

    session.status = TELEGRAM_LOGIN_SESSION_STATUSES.CONSUMED;
    session.consumedAt = new Date();
    await session.save();

    return session.userId.toString();
  }

  static async handleWebhook(payload: TelegramWebhookPayload) {
    const message = payload.message;
    if (!message || !message.from) return { handled: false };

    if (message.text?.startsWith("/start")) {
      await TelegramService.handleStart(message);
      return { handled: true, type: "start" };
    }

    if (message.contact) {
      const result = await TelegramService.handleContact(message);
      return { handled: true, type: "contact", ...result };
    }

    await TelegramService.sendMessage(message.chat.id.toString(), "Para verificar tu cuenta, toca /start y comparte tu número desde el botón del bot.");
    return { handled: true, type: "unknown_message" };
  }

  private static async handleStart(message: TelegramMessage) {
    const chatId = message.chat.id.toString();
    const token = TelegramService.extractLoginToken(message.text ?? "");

    if (token) {
      const loginSession = await TelegramLoginSessionModel.findOne({ tokenHash: hashToken(token) });

      if (!loginSession || loginSession.expiresAt.getTime() <= Date.now()) {
        await TelegramService.sendMessage(chatId, "Este enlace de verificación expiró. Vuelve a abrir AurumX y genera uno nuevo.");
        return;
      }

      loginSession.telegramId = String(message.from?.id ?? "");
      loginSession.chatId = chatId;
      await loginSession.save();
    }

    await TelegramService.sendContactRequest(chatId);
  }

  private static async handleContact(message: TelegramMessage) {
    if (!message.from || !message.contact) return { verified: false };

    const telegramId = String(message.from.id);
    const contactOwnerId = message.contact.user_id ? String(message.contact.user_id) : "";

    if (contactOwnerId !== telegramId) {
      await TelegramService.sendMessage(message.chat.id.toString(), "Ese número no pertenece a tu cuenta de Telegram. Comparte tu propio contacto desde el botón oficial del bot.");
      return { verified: false, reason: "TELEGRAM_CONTACT_MISMATCH" };
    }

    const pendingSession = await TelegramLoginSessionModel.findOne({
      status: TELEGRAM_LOGIN_SESSION_STATUSES.PENDING,
      telegramId,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!pendingSession) {
      await TelegramService.sendMessage(message.chat.id.toString(), "No encontramos una sesión activa para este login. Vuelve a AurumX, toca Verificar con Telegram y comparte tu número otra vez.");
      return { verified: false, reason: "TELEGRAM_LOGIN_SESSION_NOT_FOUND" };
    }

    const mongoSession = await mongoose.startSession();
    let userId = "";

    try {
      await mongoSession.withTransaction(async () => {
        const user = await UserService.createOrUpdateTelegramVerifiedUser(
          {
            telegramId,
            telegramUsername: message.from?.username,
            firstName: message.from?.first_name,
            lastName: message.from?.last_name,
            phoneNumber: message.contact?.phone_number ?? "",
            referralCode: pendingSession.referralCode || undefined
          },
          mongoSession
        );

        userId = user._id.toString();

        pendingSession.status = TELEGRAM_LOGIN_SESSION_STATUSES.VERIFIED;
        pendingSession.telegramId = telegramId;
        pendingSession.userId = user._id;
        pendingSession.verifiedAt = new Date();
        await pendingSession.save({ session: mongoSession });

        await AuditService.log(
          {
            actor: { type: AUDIT_ACTOR_TYPES.USER, userId: user._id },
            action: AUDIT_ACTIONS.TELEGRAM_USER_VERIFIED,
            targetType: "User",
            targetId: user._id,
            metadata: { telegramId },
            session: mongoSession
          }
        );
      });
    } finally {
      await mongoSession.endSession();
    }

    await TelegramService.sendMessage(message.chat.id.toString(), "✅ Cuenta verificada correctamente en AurumX. Ya puedes volver a la plataforma y completar el login.");
    return { verified: true, userId };
  }

  private static extractLoginToken(text: string): string | null {
    const [, arg] = text.trim().split(/\s+/, 2);
    if (!arg?.startsWith("login_")) return null;
    return arg.slice("login_".length);
  }

  static async sendContactRequest(chatId: string) {
    return TelegramService.sendTelegramApi("sendMessage", {
      chat_id: chatId,
      text: "Bienvenido a AurumX. Para verificar tu cuenta, comparte tu número de teléfono usando el botón de abajo.",
      reply_markup: {
        keyboard: [[{ text: "Compartir mi número", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }

  static async sendMessage(chatId: string, text: string) {
    return TelegramService.sendTelegramApi("sendMessage", { chat_id: chatId, text });
  }

  static getWebhookUrl(): string | null {
    if (!env.APP_PUBLIC_URL || !env.TELEGRAM_WEBHOOK_SECRET) return null;

    const baseUrl = env.APP_PUBLIC_URL.replace(/\/$/, "");
    return `${baseUrl}/api/telegram/webhook?secret=${encodeURIComponent(env.TELEGRAM_WEBHOOK_SECRET)}`;
  }

  static async ensureWebhook() {
    const url = TelegramService.getWebhookUrl();

    if (!url || !env.TELEGRAM_BOT_TOKEN) {
      return { skipped: true, reason: "TELEGRAM_WEBHOOK_NOT_CONFIGURED" };
    }

    return TelegramService.sendTelegramApi("setWebhook", {
      url,
      allowed_updates: ["message"],
      drop_pending_updates: false
    });
  }

  static async getWebhookInfo() {
    return TelegramService.sendTelegramApi("getWebhookInfo", {});
  }

  static async sendTelegramApi(method: string, body: Record<string, unknown>) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      return { skipped: true, reason: "TELEGRAM_BOT_TOKEN_NOT_CONFIGURED" };
    }

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Telegram API error ${response.status}: ${errorBody}`);
    }

    return response.json();
  }
}
