import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { corsOrigins, env, isProduction } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { rateLimit } from "./middlewares/rate-limit.middleware";
import { sanitizeMiddleware } from "./middlewares/sanitize.middleware";
import { authRouter } from "./modules/auth/auth.routes";
import { userRouter } from "./modules/users/user.routes";
import { walletRouter } from "./modules/wallet/wallet.routes";
import { machineRouter } from "./modules/machines/machine.routes";
import { depositRouter } from "./modules/deposits/deposit.routes";
import { rewardRouter } from "./modules/rewards/reward.routes";
import { withdrawalRouter } from "./modules/withdrawals/withdrawal.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { referralRouter } from "./modules/referrals/referral.routes";
import { telegramRouter } from "./modules/telegram/telegram.routes";
import { notificationRouter } from "./modules/notifications/notification.routes";

const apiRateLimiter = rateLimit({
  keyPrefix: "api",
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS
});

const strictRateLimiter = rateLimit({
  keyPrefix: "strict",
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.STRICT_RATE_LIMIT_MAX_REQUESTS
});

const telegramRateLimiter = rateLimit({
  keyPrefix: "telegram",
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS
});

export function createApp() {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || !isProduction || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin not allowed"));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(sanitizeMiddleware);
  app.use(apiRateLimiter);

  if (!isProduction) {
    app.use(morgan("dev"));
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      service: "AurumX API",
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/auth", strictRateLimiter, authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/wallet", walletRouter);
  app.use("/api/machines", machineRouter);
  app.use("/api/deposits", strictRateLimiter, depositRouter);
  app.use("/api/rewards", rewardRouter);
  app.use("/api/withdrawals", strictRateLimiter, withdrawalRouter);
  app.use("/api/referrals", referralRouter);
  app.use("/api/telegram", telegramRateLimiter, telegramRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/admin", adminRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: error.flatten().fieldErrors
      });
      return;
    }

    next(error);
  });

  app.use(errorMiddleware);

  return app;
}
