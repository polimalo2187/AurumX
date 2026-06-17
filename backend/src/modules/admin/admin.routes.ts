import { Router } from "express";
import { adminMiddleware } from "../../middlewares/admin.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { AdminWithdrawalsController } from "./admin-withdrawals.controller";
import { AdminUsersController } from "./admin-users.controller";
import { AdminDepositsController } from "./admin-deposits.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminAuditController } from "./admin-audit.controller";
import { RiskController } from "../risk/risk.controller";

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.get("/dashboard", AdminDashboardController.getDashboard);

adminRouter.get("/users", AdminUsersController.listUsers);
adminRouter.get("/users/:id", AdminUsersController.getUserDetail);
adminRouter.post("/users/:id/block", AdminUsersController.blockUser);
adminRouter.post("/users/:id/unblock", AdminUsersController.unblockUser);

adminRouter.get("/deposits", AdminDepositsController.listDeposits);
adminRouter.get("/deposits/:id", AdminDepositsController.getDepositDetail);
adminRouter.post("/deposits/:id/retry-verification", AdminDepositsController.retryVerification);
adminRouter.post("/deposits/:id/reject", AdminDepositsController.rejectDeposit);

adminRouter.get("/withdrawals/pending", AdminWithdrawalsController.getPendingWithdrawals);
adminRouter.post("/withdrawals/:id/approve", AdminWithdrawalsController.approveWithdrawal);
adminRouter.post("/withdrawals/:id/reject", AdminWithdrawalsController.rejectWithdrawal);

adminRouter.get("/audit-logs", AdminAuditController.listAuditLogs);

adminRouter.get("/risk/summary", RiskController.getSummary);
adminRouter.get("/risk/flags", RiskController.listFlags);
adminRouter.get("/risk/flags/:id", RiskController.getFlag);
adminRouter.post("/risk/flags/:id/resolve", RiskController.resolveFlag);
adminRouter.post("/risk/flags/:id/ignore", RiskController.ignoreFlag);
adminRouter.post("/risk/users/:id/evaluate", RiskController.evaluateUser);
