import { z } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { WithdrawalService } from "../withdrawals/withdrawal.service";

const approveWithdrawalSchema = z.object({
  adminTxHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  adminNote: z.string().max(1000).optional()
});

const rejectWithdrawalSchema = z.object({
  adminNote: z.string().min(1).max(1000)
});

const paramsSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId")
});

export class AdminWithdrawalsController {
  static getPendingWithdrawals = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await WithdrawalService.getPendingWithdrawals({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 50)
    });

    res.json({
      success: true,
      data: result
    });
  });

  static approveWithdrawal = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = approveWithdrawalSchema.parse(req.body);
    const params = paramsSchema.parse(req.params);

    const withdrawal = await WithdrawalService.approveWithdrawal({
      adminId: req.user._id,
      withdrawalId: params.id,
      adminTxHash: body.adminTxHash,
      adminNote: body.adminNote
    });

    res.json({
      success: true,
      message: "Retiro aprobado correctamente",
      data: withdrawal
    });
  });

  static rejectWithdrawal = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = rejectWithdrawalSchema.parse(req.body);
    const params = paramsSchema.parse(req.params);

    const withdrawal = await WithdrawalService.rejectWithdrawal({
      adminId: req.user._id,
      withdrawalId: params.id,
      adminNote: body.adminNote
    });

    res.json({
      success: true,
      message: "Retiro rechazado correctamente",
      data: withdrawal
    });
  });
}
