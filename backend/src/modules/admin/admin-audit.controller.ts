import { z } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { AuditService } from "../audit/audit.service";

const auditQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  actorUserId: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  action: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export class AdminAuditController {
  static listAuditLogs = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const query = auditQuerySchema.parse(req.query);
    const result = await AuditService.list(query);

    res.json({ success: true, data: result });
  });
}
