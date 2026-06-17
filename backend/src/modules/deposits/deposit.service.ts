import mongoose, { type ClientSession, type Types } from "mongoose";
import { env } from "../../config/env";
import { MACHINE_TYPES, SYSTEM_RULES } from "../../config/constants";
import { DepositOrderModel, DEPOSIT_ORDER_STATUSES, type DepositOrder } from "../../models/DepositOrder.model";
import { MachinePlanModel } from "../../models/MachinePlan.model";
import { USER_MACHINE_SOURCE_TYPES } from "../../models/UserMachine.model";
import type { User } from "../../models/User.model";
import { badRequest, conflict, notFound } from "../../utils/errors";
import { addHours } from "../../utils/dates";
import { normalizeTxHash } from "../../utils/tx-hash";
import { normalizeBscAddress } from "../../utils/bsc-address";
import { MachinePlanService } from "../machines/machine-plan.service";
import { MachineService } from "../machines/machine.service";
import { BscUsdtService } from "../blockchain/bsc-usdt.service";
import type { DepositVerificationResult } from "../blockchain/blockchain.service";
import { ReferralService } from "../referrals/referral.service";
import { RiskService } from "../risk/risk.service";

export type DepositOrderDTO = {
  id: string;
  userId: string;
  machinePlanId: string;
  machineName?: string;
  machineSlug?: string;
  expectedAmountUSDT: number;
  currency: string;
  network: string;
  tokenStandard: string;
  depositAddress: string;
  userSubmittedTxHash?: string | null;
  status: string;
  verificationStatus?: string | null;
  confirmedAmountUSDT?: number | null;
  rejectionReason?: string;
  expiresAt: Date;
  submittedAt?: Date | null;
  confirmedAt?: Date | null;
  rejectedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class DepositService {
  static toDTO(
    order: DepositOrder,
    plan?: { name?: string; slug?: string }
  ): DepositOrderDTO {
    return {
      id: order._id.toString(),
      userId: order.userId.toString(),
      machinePlanId: order.machinePlanId.toString(),
      machineName: plan?.name,
      machineSlug: plan?.slug,
      expectedAmountUSDT: order.expectedAmountUSDT,
      currency: order.currency,
      network: order.network,
      tokenStandard: order.tokenStandard,
      depositAddress: order.depositAddress,
      userSubmittedTxHash: order.userSubmittedTxHash,
      status: order.status,
      verificationStatus: order.verificationStatus,
      confirmedAmountUSDT: order.confirmedAmountUSDT,
      rejectionReason: order.rejectionReason,
      expiresAt: order.expiresAt,
      submittedAt: order.submittedAt,
      confirmedAt: order.confirmedAt,
      rejectedAt: order.rejectedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  static async createOrder(user: User, machinePlanId: string): Promise<DepositOrderDTO> {
    if (!user.phoneVerified) {
      throw badRequest("Telegram phone verification is required", "PHONE_NOT_VERIFIED");
    }

    if (!env.PLATFORM_BSC_DEPOSIT_ADDRESS) {
      throw new Error("PLATFORM_BSC_DEPOSIT_ADDRESS is required");
    }

    const plan = await MachinePlanModel.findOne({
      _id: machinePlanId,
      type: MACHINE_TYPES.PAID,
      isActive: true
    });

    if (!plan) {
      throw notFound("Paid machine plan not found", "PAID_MACHINE_PLAN_NOT_FOUND");
    }

    const economics = MachinePlanService.getPlanEconomics(plan);
    const depositAddress = normalizeBscAddress(env.PLATFORM_BSC_DEPOSIT_ADDRESS);

    const order = await DepositOrderModel.create({
      userId: user._id,
      machinePlanId: plan._id,
      expectedAmountUSDT: economics.principalAmount,
      currency: SYSTEM_RULES.CURRENCY,
      network: SYSTEM_RULES.NETWORK,
      tokenStandard: SYSTEM_RULES.TOKEN_STANDARD,
      depositAddress,
      status: DEPOSIT_ORDER_STATUSES.PENDING_PAYMENT,
      expiresAt: addHours(new Date(), SYSTEM_RULES.DEPOSIT_ORDER_EXPIRES_HOURS)
    });

    return DepositService.toDTO(order, { name: plan.name, slug: plan.slug });
  }

  static async getUserOrders(user: User): Promise<DepositOrderDTO[]> {
    const orders = await DepositOrderModel.find({ userId: user._id }).sort({ createdAt: -1 });
    const planIds = [...new Set(orders.map((order) => order.machinePlanId.toString()))];
    const plans = await MachinePlanModel.find({ _id: { $in: planIds } }).select("name slug");
    const planMap = new Map(plans.map((plan) => [plan._id.toString(), plan]));

    return orders.map((order) => {
      const plan = planMap.get(order.machinePlanId.toString());
      return DepositService.toDTO(order, { name: plan?.name, slug: plan?.slug });
    });
  }

  static async submitHash(user: User, orderId: string, txHash: string) {
    const normalizedHash = normalizeTxHash(txHash);

    const existingHash = await DepositOrderModel.exists({
      userSubmittedTxHash: normalizedHash,
      _id: { $ne: orderId }
    });

    if (existingHash) {
      throw conflict("This transaction hash was already used", "TX_HASH_ALREADY_USED");
    }

    const order = await DepositOrderModel.findOne({
      _id: orderId,
      userId: user._id,
      status: { $in: [DEPOSIT_ORDER_STATUSES.PENDING_PAYMENT, DEPOSIT_ORDER_STATUSES.HASH_SUBMITTED] }
    });

    if (!order) {
      throw notFound("Deposit order not found or not available", "DEPOSIT_ORDER_NOT_FOUND");
    }

    if (order.expiresAt.getTime() <= Date.now()) {
      order.status = DEPOSIT_ORDER_STATUSES.EXPIRED;
      await order.save();
      throw badRequest("Deposit order expired", "DEPOSIT_ORDER_EXPIRED");
    }

    order.userSubmittedTxHash = normalizedHash;
    order.status = DEPOSIT_ORDER_STATUSES.VERIFYING;
    order.submittedAt = new Date();
    await order.save();

    return DepositService.verifyOrder(order._id);
  }

  static async verifyOrder(orderId: Types.ObjectId | string) {
    const order = await DepositOrderModel.findById(orderId);

    if (!order) {
      throw notFound("Deposit order not found", "DEPOSIT_ORDER_NOT_FOUND");
    }

    if (!order.userSubmittedTxHash) {
      throw badRequest("Deposit order has no submitted hash", "MISSING_TX_HASH");
    }

    if (order.status === DEPOSIT_ORDER_STATUSES.CONFIRMED) {
      return {
        status: "CONFIRMED",
        message: "Deposit already confirmed",
        order: DepositService.toDTO(order)
      };
    }

    if (order.expiresAt.getTime() <= Date.now()) {
      order.status = DEPOSIT_ORDER_STATUSES.EXPIRED;
      await order.save();

      return {
        status: "EXPIRED",
        message: "Deposit order expired",
        order: DepositService.toDTO(order)
      };
    }

    order.status = DEPOSIT_ORDER_STATUSES.VERIFYING;
    await order.save();

    const verifier = new BscUsdtService();
    const result = await verifier.verifyBep20UsdtDeposit({
      txHash: order.userSubmittedTxHash,
      expectedReceiver: order.depositAddress,
      expectedAmountUSDT: order.expectedAmountUSDT
    });

    if (result.valid) {
      const activation = await DepositService.confirmAndActivate(order._id, result);

      return {
        status: "CONFIRMED",
        message: "Depósito verificado. Máquina activada correctamente.",
        order: activation.order,
        machine: activation.machine
      };
    }

    if (result.status === "PENDING_CONFIRMATIONS" || result.status === "TX_NOT_FOUND") {
      order.status = DEPOSIT_ORDER_STATUSES.HASH_SUBMITTED;
      order.verificationStatus = result.status;
      order.verificationResult = result;
      await order.save();

      return {
        status: result.status,
        message: "Transacción recibida. Esperando confirmaciones o disponibilidad en red.",
        order: DepositService.toDTO(order)
      };
    }

    const needsReview = result.status === "UNKNOWN_ERROR";
    order.status = needsReview ? DEPOSIT_ORDER_STATUSES.NEEDS_REVIEW : DEPOSIT_ORDER_STATUSES.REJECTED;
    order.verificationStatus = result.status;
    order.verificationResult = result;
    order.rejectionReason = result.reason ?? result.status;
    order.rejectedAt = needsReview ? null : new Date();
    await order.save();

    return {
      status: order.status,
      message: "No se pudo validar automáticamente el depósito.",
      order: DepositService.toDTO(order)
    };
  }

  static async confirmAndActivate(orderId: Types.ObjectId, result: DepositVerificationResult) {
    const session = await mongoose.startSession();

    try {
      let dtoOrder: DepositOrderDTO | null = null;
      let dtoMachine: Awaited<ReturnType<typeof MachineService.toDTO>> | null = null;
      let sponsorUserIdForRisk: Types.ObjectId | null = null;

      await session.withTransaction(async () => {
        const order = await DepositOrderModel.findOne({
          _id: orderId,
          status: { $ne: DEPOSIT_ORDER_STATUSES.CONFIRMED }
        }).session(session);

        if (!order) {
          throw conflict("Deposit order already confirmed", "DEPOSIT_ALREADY_CONFIRMED");
        }

        order.status = DEPOSIT_ORDER_STATUSES.CONFIRMED;
        order.verificationStatus = result.status;
        order.verificationResult = result;
        order.confirmedAmountUSDT = result.amountUSDT ?? order.expectedAmountUSDT;
        order.confirmedAt = new Date();
        await order.save({ session });

        const machine = await MachineService.createUserMachineFromPlan({
          userId: order.userId,
          planId: order.machinePlanId,
          sourceType: USER_MACHINE_SOURCE_TYPES.PAID_DEPOSIT,
          depositOrderId: order._id,
          session
        });

        sponsorUserIdForRisk = await ReferralService.processValidReferral({
          referredUserId: order.userId,
          sourceDepositOrderId: order._id,
          sourceUserMachineId: machine._id,
          session
        });

        const plan = await MachinePlanModel.findById(order.machinePlanId).session(session);
        const user = await mongoose.model("User").findById(order.userId).session(session);

        if (!user) {
          throw notFound("User not found", "USER_NOT_FOUND");
        }

        dtoOrder = DepositService.toDTO(order, { name: plan?.get("name"), slug: plan?.get("slug") });
        dtoMachine = MachineService.toDTO(machine, user, { name: plan?.get("name"), slug: plan?.get("slug") });
      });

      if (!dtoOrder || !dtoMachine) {
        throw new Error("Deposit confirmation transaction failed");
      }

      if (sponsorUserIdForRisk) {
        try {
          await RiskService.evaluateReferralRisk(sponsorUserIdForRisk);
        } catch (error) {
          console.error("Risk evaluation failed for referral:", error);
        }
      }

      return { order: dtoOrder, machine: dtoMachine };
    } finally {
      await session.endSession();
    }
  }

  static async verifyPendingOrders(limit = 50) {
    const orders = await DepositOrderModel.find({
      status: { $in: [DEPOSIT_ORDER_STATUSES.HASH_SUBMITTED, DEPOSIT_ORDER_STATUSES.VERIFYING] },
      userSubmittedTxHash: { $type: "string" }
    })
      .sort({ submittedAt: 1 })
      .limit(limit);

    const results = [];

    for (const order of orders) {
      try {
        results.push(await DepositService.verifyOrder(order._id));
      } catch (error) {
        results.push({
          status: "FAILED",
          orderId: order._id.toString(),
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return results;
  }
}
