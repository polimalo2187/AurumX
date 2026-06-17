import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminMiddleware } from "../../middlewares/admin.middleware";
import { NotificationController } from "./notification.controller";

export const notificationRouter = Router();

notificationRouter.use(authMiddleware, adminMiddleware);
notificationRouter.post("/run", NotificationController.runPending);
