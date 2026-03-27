import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit(params: {
  action: string;
  performedById: string;
  targetUserId?: string;
  targetType?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.adminAuditLog.create({
    data: {
      action: params.action,
      performedById: params.performedById,
      targetUserId: params.targetUserId,
      targetType: params.targetType,
      metadata: params.metadata,
    },
  });
}
