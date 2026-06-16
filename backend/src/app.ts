import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { env, isProduction } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRouter } from "./modules/auth/auth.routes";
import { userRouter } from "./modules/users/user.routes";
import { walletRouter } from "./modules/wallet/wallet.routes";
import { machineRouter } from "./modules/machines/machine.routes";
import { depositRouter } from "./modules/deposits/deposit.routes";
import { rewardRouter } from "./modules/rewards/reward.routes";

export function createApp() {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: env.FRONTEND_URL || "*",
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

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

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/wallet", walletRouter);
  app.use("/api/machines", machineRouter);
  app.use("/api/deposits", depositRouter);
  app.use("/api/rewards", rewardRouter);

  app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
