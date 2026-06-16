import { z } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { WithdrawalService } from "./withdrawal.service";

const requestWithdrawalSchema = z.object({
  amount: z.coerce.number().positive(),
  network: z.literal("BEP20").or(z.literal("BSC")).optional(),
  destinationAddress: z.string().min(1)
});

export class WithdrawalController {
  static requestWithdrawal = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = requestWithdrawalSchema.parse(req.body);

    const withdrawal = await WithdrawalService.requestWithdrawal({
      userId: req.user._id,
      amount: body.amount,
      destinationAddress: body.destinationAddress
    });

    res.status(201).json({
      success: true,
      message: "Retiro solicitado correctamente",
      data: withdrawal
    });
  });

  static getMyWithdrawals = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await WithdrawalService.getUserWithdrawals(req.user._id, {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20)
    });

    res.json({
      success: true,
      data: result
    });
  });
}
