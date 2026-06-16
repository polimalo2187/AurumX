import { Router } from "express";
import { adminMiddleware } from "../../middlewares/admin.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { AdminWithdrawalsController } from "./admin-withdrawals.controller";

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.get("/withdrawals/pending", AdminWithdrawalsController.getPendingWithdrawals);
adminRouter.post("/withdrawals/:id/approve", AdminWithdrawalsController.approveWithdrawal);
adminRouter.post("/withdrawals/:id/reject", AdminWithdrawalsController.rejectWithdrawal);
