import { z } from 'zod'

export const createApprovalParamsSchema = z.object({
  reportId: z.coerce.number().int(),
})

export const createApprovalBodySchema = z.object({
  decision: z.enum(['Approved', 'Rejected', 'AdjustmentRequested']),
  comment: z.string().optional(),
})
