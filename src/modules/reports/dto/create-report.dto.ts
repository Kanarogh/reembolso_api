import { z } from 'zod'

export const createReportBodySchema = z.object({
  periodFrom: z.string().datetime(), // Espera uma data no formato ISO 8601
  periodTo: z.string().datetime(),
  client: z.string().optional(),
})