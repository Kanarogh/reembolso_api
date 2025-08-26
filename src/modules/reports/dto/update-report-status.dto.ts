// src/modules/reports/dto/update-report-status.dto.ts
import { ReportStatus } from '@prisma/client'
import { z } from 'zod'

export const updateReportStatusParamsSchema = z.object({
  id: z.coerce.number().int(),
})

export const updateReportStatusBodySchema = z.object({
  status: z.nativeEnum(ReportStatus),
})
