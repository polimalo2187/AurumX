import { Router } from "express";
import { internalOrAdminMiddleware } from "../../middlewares/internal-or-admin.middleware";
import { NotificationController } from "./notification.controller";

export const notificationRouter = Router();

notificationRouter.post("/run", internalOrAdminMiddleware, NotificationController.runPending);
