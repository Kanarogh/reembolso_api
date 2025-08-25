// src/modules/reports/dto/delete-expense.dto.ts
import { z } from 'zod'

export const deleteExpenseParamsSchema = z.object({
  reportId: z.coerce.number().int(),
  expenseId: z.coerce.number().int(),
})