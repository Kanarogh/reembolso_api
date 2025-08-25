// src/modules/reports/dto/get-report.dto.ts
import { z } from 'zod'

export const getReportParamsSchema = z.object({
  // z.coerce tenta converter a string da URL para um número
  id: z.coerce.number().int(),
})