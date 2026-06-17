import { z } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { notFound } from "../../utils/errors";
import { DepositOrderModel, DEPOSIT_ORDER_STATUSES } from "../../models/DepositOrder.model";
import { DepositService } from "../deposits/deposit.service";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS, AUDIT_ACTOR_TYPES } from "../../models/AuditLog.model";

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

const listDepositsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.enum(Object.values(DEPOSIT_ORDER_STATUSES) as [string, ...string[]]).optional(),
  userId: objectIdSchema.optional()
});
const idParamsSchema = z.object({ id: objectIdSchema });
const rejectBodySchema = z.object({ reason: z.string().min(1).max(1000) });

export class AdminDepositsController {
  static listDeposits = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const query = listDepositsQuerySchema.parse(req.query);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.userId) filter.userId = query.userId;

    const [items, total] = await Promise.all([
      DepositOrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "telegramId telegramUsername phoneNumber firstName lastName")
        .populate("machinePlanId", "name slug type priceUSDT"),
      DepositOrderModel.countDocuments(filter)
    ]);

    res.json({ success: true, data: { items, page, total, totalPages: Math.ceil(total / limit) } });
  });

  static getDepositDetail = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);
    const order = await DepositOrderModel.findById(params.id)
      .populate("userId", "telegramId telegramUsername phoneNumber firstName lastName")
      .populate("machinePlanId", "name slug type priceUSDT");

    if (!order) throw notFound("Deposit order not found", "DEPOSIT_ORDER_NOT_FOUND");

    res.json({ success: true, data: order });
  });

  static retryVerification = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);
    const result = await DepositService.verifyOrder(params.id);

    await AuditService.log({
      actor: { type: AUDIT_ACTOR_TYPES.ADMIN, userId: req.user._id },
      action: AUDIT_ACTIONS.DEPOSIT_RETRY_VERIFICATION,
      targetType: "DepositOrder",
      targetId: (await DepositOrderModel.findById(params.id).select("_id"))?._id ?? null,
      metadata: { resultStatus: result.status },
      ip: req.ip,
      userAgent: req.get("user-agent") ?? ""
    });

    res.json({ success: true, data: result });
  });

  static rejectDeposit = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);
    const body = rejectBodySchema.parse(req.body);

    const order = await DepositOrderModel.findById(params.id);
    if (!order) throw notFound("Deposit order not found", "DEPOSIT_ORDER_NOT_FOUND");

    const before = { status: order.status, rejectionReason: order.rejectionReason };
    order.status = DEPOSIT_ORDER_STATUSES.REJECTED;
    order.rejectionReason = body.reason;
    order.rejectedAt = new Date();
    await order.save();

    await AuditService.log({
      actor: { type: AUDIT_ACTOR_TYPES.ADMIN, userId: req.user._id },
      action: AUDIT_ACTIONS.DEPOSIT_ADMIN_REJECTED,
      targetType: "DepositOrder",
      targetId: order._id,
      before,
      after: { status: order.status, rejectionReason: order.rejectionReason },
      ip: req.ip,
      userAgent: req.get("user-agent") ?? ""
    });

    res.json({ success: true, message: "Depósito rechazado", data: order });
  });
}
