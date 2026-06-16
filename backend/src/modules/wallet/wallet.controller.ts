import { asyncHandler } from "../../utils/async-handler";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { WalletService } from "./wallet.service";
import { WalletTransactionModel } from "../../models/WalletTransaction.model";

export class WalletController {
  static getMyWallet = asyncHandler(async (req, res) => {
    const wallet = await WalletService.getWalletOrFail(req.user._id);

    res.json({
      success: true,
      data: {
        availableUSDT: wallet.availableUSDT,
        lockedUSDT: wallet.lockedUSDT
      }
    });
  });

  static getMyTransactions = asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      WalletTransactionModel.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WalletTransactionModel.countDocuments({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        items,
        page,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  });
}
