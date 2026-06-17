import { z } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import {
  RISK_FLAG_SEVERITIES,
  RISK_FLAG_STATUSES,
  RISK_FLAG_TYPES
} from "../../models/RiskFlag.model";
import { RiskService } from "./risk.service";

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

const listFlagsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.enum(Object.values(RISK_FLAG_STATUSES) as [string, ...string[]]).optional(),
  severity: z.enum(Object.values(RISK_FLAG_SEVERITIES) as [string, ...string[]]).optional(),
  type: z.enum(Object.values(RISK_FLAG_TYPES) as [string, ...string[]]).optional(),
  userId: objectIdSchema.optional()
});

const idParamsSchema = z.object({ id: objectIdSchema });
const userIdParamsSchema = z.object({ id: objectIdSchema });
const resolutionBodySchema = z.object({ note: z.string().min(1).max(1000) });

export class RiskController {
  static getSummary = asyncHandler(async (_req: AuthenticatedRequest, res) => {
    const summary = await RiskService.getSummary();
    res.json({ success: true, data: summary });
  });

  static listFlags = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const query = listFlagsQuerySchema.parse(req.query);
    const result = await RiskService.listFlags(query);
    res.json({ success: true, data: result });
  });

  static getFlag = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);
    const flag = await RiskService.getFlag(params.id);
    res.json({ success: true, data: flag });
  });

  static resolveFlag = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);
    const body = resolutionBodySchema.parse(req.body);

    const flag = await RiskService.resolveFlag({
      adminId: req.user._id,
      flagId: params.id,
      status: RISK_FLAG_STATUSES.RESOLVED,
      note: body.note
    });

    res.json({ success: true, message: "Alerta de riesgo resuelta", data: flag });
  });

  static ignoreFlag = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = idParamsSchema.parse(req.params);
    const body = resolutionBodySchema.parse(req.body);

    const flag = await RiskService.resolveFlag({
      adminId: req.user._id,
      flagId: params.id,
      status: RISK_FLAG_STATUSES.IGNORED,
      note: body.note
    });

    res.json({ success: true, message: "Alerta de riesgo ignorada", data: flag });
  });

  static evaluateUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = userIdParamsSchema.parse(req.params);
    const result = await RiskService.evaluateUser(params.id);
    res.json({ success: true, message: "Evaluación de riesgo ejecutada", data: result });
  });
}
