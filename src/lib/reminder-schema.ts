import { z } from "zod";

/** Validation for a study reminder (create = full, update = partial). */
export const reminderInput = z.object({
  label: z.string().max(60).nullable().optional(),
  window: z.enum(["morning", "evening"]),
  sessionType: z.enum(["micro", "quick", "deep", "repair", "recovery", "intensive"]),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  domainSlug: z.string().max(80).nullable().optional(),
  isActive: z.boolean().optional(),
});
