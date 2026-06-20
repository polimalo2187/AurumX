import mongoose from "mongoose";
import { z } from "zod";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/async-handler";
import { forbidden } from "../../utils/errors";
import { AuthService } from "./auth.service";
import { UserService } from "../users/user.service";
import { TelegramService } from "../telegram/telegram.service";

const devTelegramVerifySchema = z.object({
  telegramId: z.string().min(1),
  phoneNumber: z.string().min(5),
  telegramUsername: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  referralCode: z.string().optional()
});

const issueTokenSchema = z.object({
  userId: z.string().min(1)
});

const startTelegramLoginSchema = z.object({
  referralCode: z.string().optional()
});

const completeTelegramLoginSchema = z.object({
  verificationToken: z.string().min(32).max(64)
});

export class AuthController {
  static startTelegramLogin = asyncHandler(async (req, res) => {
    const body = startTelegramLoginSchema.parse(req.body);
    const result = await TelegramService.createLoginSession(body.referralCode);

    res.status(201).json({ success: true, data: result });
  });

  static completeTelegramLogin = asyncHandler(async (req, res) => {
    const body = completeTelegramLoginSchema.parse(req.body);
    const userId = await TelegramService.completeLoginSession(body.verificationToken);
    const result = await AuthService.issueTokenForVerifiedUser(userId);

    res.json({ success: true, data: result });
  });

  static devTelegramVerify = asyncHandler(async (req, res) => {
    if (env.NODE_ENV === "production") {
      throw forbidden("Dev auth endpoint is disabled in production", "DEV_AUTH_DISABLED");
    }

    const body = devTelegramVerifySchema.parse(req.body);
    const session = await mongoose.startSession();
    let userId = "";

    try {
      await session.withTransaction(async () => {
        const user = await UserService.createOrUpdateTelegramVerifiedUser(body, session);
        userId = user._id.toString();
      });
    } finally {
      await session.endSession();
    }

    const result = await AuthService.issueTokenForVerifiedUser(userId);

    res.json({
      success: true,
      data: result
    });
  });

  static issueToken = asyncHandler(async (req, res) => {
    if (env.NODE_ENV === "production") {
      throw forbidden("Dev token endpoint is disabled in production", "DEV_AUTH_DISABLED");
    }

    const body = issueTokenSchema.parse(req.body);
    const result = await AuthService.issueTokenForVerifiedUser(body.userId);

    res.json({
      success: true,
      data: result
    });
  });

  static status = asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      service: "AurumX Auth",
      message: "Telegram auth module ready"
    });
  });
}
