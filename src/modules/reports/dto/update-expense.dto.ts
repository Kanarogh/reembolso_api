// src/modules/reports/dto/update-expense.dto.ts
import { z } from 'zod'
import { createExpenseBodySchema } from '../../expenses/dto/create-expense.dto.js'


// Reutilizamos o schema de criação e tornamos todos os campos opcionais
export const updateExpenseBodySchema = createExpenseBodySchema.partial()

export const updateExpenseParamsSchema = z.object({
  reportId: z.coerce.number().int(),
  expenseId: z.coerce.number().int(),
})
