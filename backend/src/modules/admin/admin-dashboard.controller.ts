import { asyncHandler } from "../../utils/async-handler";
import { UserModel, USER_STATUSES } from "../../models/User.model";
import { WalletModel } from "../../models/Wallet.model";
import { UserMachineModel, USER_MACHINE_STATUSES } from "../../models/UserMachine.model";
import { DepositOrderModel, DEPOSIT_ORDER_STATUSES } from "../../models/DepositOrder.model";
import { WithdrawalRequestModel, WITHDRAWAL_STATUSES } from "../../models/WithdrawalRequest.model";
import { RiskFlagModel, RISK_FLAG_STATUSES, RISK_FLAG_SEVERITIES } from "../../models/RiskFlag.model";

export class AdminDashboardController {
  static getDashboard = asyncHandler(async (_req, res) => {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      activeMachines,
      completedMachines,
      pendingDeposits,
      reviewDeposits,
      confirmedDeposits,
      pendingWithdrawals,
      approvedWithdrawals,
      walletsAgg,
      depositsAgg,
      withdrawalsAgg,
      machinesAgg,
      openRiskFlags,
      highRiskFlags,
      riskFlaggedUsers
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ status: USER_STATUSES.ACTIVE }),
      UserModel.countDocuments({ status: USER_STATUSES.BLOCKED }),
      UserMachineModel.countDocuments({ status: USER_MACHINE_STATUSES.ACTIVE }),
      UserMachineModel.countDocuments({ status: USER_MACHINE_STATUSES.COMPLETED }),
      DepositOrderModel.countDocuments({ status: { $in: [DEPOSIT_ORDER_STATUSES.PENDING_PAYMENT, DEPOSIT_ORDER_STATUSES.HASH_SUBMITTED, DEPOSIT_ORDER_STATUSES.VERIFYING] } }),
      DepositOrderModel.countDocuments({ status: DEPOSIT_ORDER_STATUSES.NEEDS_REVIEW }),
      DepositOrderModel.countDocuments({ status: DEPOSIT_ORDER_STATUSES.CONFIRMED }),
      WithdrawalRequestModel.countDocuments({ status: WITHDRAWAL_STATUSES.PENDING }),
      WithdrawalRequestModel.countDocuments({ status: WITHDRAWAL_STATUSES.APPROVED }),
      WalletModel.aggregate([
        { $group: { _id: null, availableUSDT: { $sum: "$availableUSDT" }, lockedUSDT: { $sum: "$lockedUSDT" } } }
      ]),
      DepositOrderModel.aggregate([
        { $match: { status: DEPOSIT_ORDER_STATUSES.CONFIRMED } },
        { $group: { _id: null, confirmedAmountUSDT: { $sum: "$confirmedAmountUSDT" } } }
      ]),
      WithdrawalRequestModel.aggregate([
        { $match: { status: WITHDRAWAL_STATUSES.APPROVED } },
        { $group: { _id: null, approvedAmountUSDT: { $sum: "$amount" } } }
      ]),
      UserMachineModel.aggregate([
        { $group: { _id: null, paidAmount: { $sum: "$paidAmount" }, maxPayoutAmount: { $sum: "$maxPayoutAmount" } } }
      ]),
      RiskFlagModel.countDocuments({ status: RISK_FLAG_STATUSES.OPEN }),
      RiskFlagModel.countDocuments({ status: RISK_FLAG_STATUSES.OPEN, severity: { $in: [RISK_FLAG_SEVERITIES.HIGH, RISK_FLAG_SEVERITIES.CRITICAL] } }),
      UserModel.countDocuments({ riskFlagged: true })
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, blocked: blockedUsers },
        machines: {
          active: activeMachines,
          completed: completedMachines,
          paidAmountUSDT: machinesAgg[0]?.paidAmount ?? 0,
          maxPayoutAmountUSDT: machinesAgg[0]?.maxPayoutAmount ?? 0
        },
        deposits: {
          pending: pendingDeposits,
          needsReview: reviewDeposits,
          confirmed: confirmedDeposits,
          confirmedAmountUSDT: depositsAgg[0]?.confirmedAmountUSDT ?? 0
        },
        withdrawals: {
          pending: pendingWithdrawals,
          approved: approvedWithdrawals,
          approvedAmountUSDT: withdrawalsAgg[0]?.approvedAmountUSDT ?? 0
        },
        wallets: {
          availableUSDT: walletsAgg[0]?.availableUSDT ?? 0,
          lockedUSDT: walletsAgg[0]?.lockedUSDT ?? 0
        },
        risk: {
          openFlags: openRiskFlags,
          highRiskFlags,
          flaggedUsers: riskFlaggedUsers
        }
      }
    });
  });
}
