import mongoose from "mongoose";
import { z } from "zod";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/async-handler";
import { forbidden } from "../../utils/errors";
import { AuthService } from "./auth.service";
import { UserService } from "../users/user.service";
import { TelegramService } from "../telegram/telegram.service";


const registerSchema = z.object({
  username: z.string().min(3).max(24),
  countryCode: z.string().min(1).max(8),
  phoneNumber: z.string().min(4).max(24),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128).optional(),
  referralCode: z.string().optional()
});

const loginSchema = z.object({
  identifier: z.string().min(3).max(80),
  password: z.string().min(8).max(128)
});

const completeRegistrationSchema = z.object({
  verificationToken: z.string().min(32).max(64)
});

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

  static register = asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await AuthService.register(body);

    res.status(201).json({
      success: true,
      data: result
    });
  });

  static completeRegistration = asyncHandler(async (req, res) => {
    const body = completeRegistrationSchema.parse(req.body);
    const userId = await TelegramService.completeLoginSession(body.verificationToken);
    const result = await AuthService.issueTokenForVerifiedUser(userId);

    res.json({
      success: true,
      data: result
    });
  });

  static login = asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await AuthService.login(body);

    res.json({
      success: true,
      data: result
    });
  });

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
