import { z } from "zod";
import { asyncHandler } from "../../utils/async-handler";
import { DepositService } from "./deposit.service";

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

const createDepositOrderSchema = z.object({
  machinePlanId: objectIdSchema
});

const depositParamsSchema = z.object({
  id: objectIdSchema
});

const submitHashSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash")
});

export class DepositController {
  static createOrder = asyncHandler(async (req, res) => {
    const body = createDepositOrderSchema.parse(req.body);
    const order = await DepositService.createOrder(req.user, body.machinePlanId);

    res.status(201).json({
      success: true,
      message: "Orden de depósito creada correctamente",
      data: order
    });
  });

  static submitHash = asyncHandler(async (req, res) => {
    const body = submitHashSchema.parse(req.body);
    const params = depositParamsSchema.parse(req.params);
    const result = await DepositService.submitHash(req.user, params.id, body.txHash);

    res.json({
      success: true,
      data: result
    });
  });

  static getMyOrders = asyncHandler(async (req, res) => {
    const orders = await DepositService.getUserOrders(req.user);

    res.json({
      success: true,
      data: orders
    });
  });
}
