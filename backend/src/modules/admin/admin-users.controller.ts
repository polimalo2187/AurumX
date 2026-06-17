import { z } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { notFound } from "../../utils/errors";
import { UserModel, USER_STATUSES } from "../../models/User.model";
import { WalletModel } from "../../models/Wallet.model";
import { UserMachineModel } from "../../models/UserMachine.model";
import { DepositOrderModel } from "../../models/DepositOrder.model";
import { WithdrawalRequestModel } from "../../models/WithdrawalRequest.model";
import { ReferralPowerEventModel } from "../../models/ReferralPowerEvent.model";
import { sanitizeUser } from "../users/user.service";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS, AUDIT_ACTOR_TYPES } from "../../models/AuditLog.model";

const listUsersQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.enum([USER_STATUSES.ACTIVE, USER_STATUSES.BLOCKED]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  search: z.string().trim().optional()
});

const idParamsSchema = z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId") });
const blockBodySchema = z.object({ reason: z.string().min(1).max(1000) });

export class AdminUsersController {
  static listUsers = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const query = listUsersQuerySchema.parse(req.query);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.role) filter.role = query.role;
    if (query.search) {
      const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { telegramId: regex },
        { telegramUsername: regex },
        { phoneNumber: regex },
        { referralCode: regex },
        { firstName: regex },
        { lastName: regex }
      ];
    }

    const [items, total] = await Promise.all([
      UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items: items.map(sanitizeUser),
        page,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  });

  static getUserDetail = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);

    const user = await UserModel.findById(params.id);
    if (!user) throw notFound("User not found", "USER_NOT_FOUND");

    const [wallet, machines, deposits, withdrawals, referredUsers, referralEvents] = await Promise.all([
      WalletModel.findOne({ userId: user._id }),
      UserMachineModel.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100).populate("machinePlanId", "name slug type priceUSDT"),
      DepositOrderModel.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100).populate("machinePlanId", "name slug type priceUSDT"),
      WithdrawalRequestModel.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100),
      UserModel.find({ referredByUserId: user._id }).sort({ createdAt: -1 }).limit(100).select("telegramId telegramUsername phoneNumber phoneVerified validReferralCount createdAt"),
      ReferralPowerEventModel.find({ sponsorUserId: user._id }).sort({ createdAt: -1 }).limit(100).populate("referredUserId", "telegramId telegramUsername phoneNumber")
    ]);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        wallet,
        machines,
        deposits,
        withdrawals,
        referrals: {
          referredUsers,
          referralEvents
        }
      }
    });
  });

  static blockUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);
    const body = blockBodySchema.parse(req.body);

    const user = await UserModel.findById(params.id);
    if (!user) throw notFound("User not found", "USER_NOT_FOUND");

    const before = { status: user.status };
    user.status = USER_STATUSES.BLOCKED;
    await user.save();

    await AuditService.log({
      actor: { type: AUDIT_ACTOR_TYPES.ADMIN, userId: req.user._id },
      action: AUDIT_ACTIONS.USER_BLOCKED,
      targetType: "User",
      targetId: user._id,
      before,
      after: { status: user.status },
      metadata: { reason: body.reason },
      ip: req.ip,
      userAgent: req.get("user-agent") ?? ""
    });

    res.json({ success: true, message: "Usuario bloqueado", data: sanitizeUser(user) });
  });

  static unblockUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);

    const user = await UserModel.findById(params.id);
    if (!user) throw notFound("User not found", "USER_NOT_FOUND");

    const before = { status: user.status };
    user.status = USER_STATUSES.ACTIVE;
    await user.save();

    await AuditService.log({
      actor: { type: AUDIT_ACTOR_TYPES.ADMIN, userId: req.user._id },
      action: AUDIT_ACTIONS.USER_UNBLOCKED,
      targetType: "User",
      targetId: user._id,
      before,
      after: { status: user.status },
      ip: req.ip,
      userAgent: req.get("user-agent") ?? ""
    });

    res.json({ success: true, message: "Usuario desbloqueado", data: sanitizeUser(user) });
  });
}
