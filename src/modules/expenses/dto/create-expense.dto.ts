import { z } from 'zod'
import { ExpenseType, LocalType, MealType } from '@prisma/client'

export const createExpenseBodySchema = z.object({
  data: z.string().datetime(),
  tipo: z.nativeEnum(ExpenseType),
  descricao: z.string().optional(),
  valorGasto: z.number().positive(),
  local: z.nativeEnum(LocalType).optional(),
  mealType: z.nativeEnum(MealType).optional(),
  foraDoMunicipio: z.boolean().default(false),
  contemItensProibidos: z.boolean().default(false),
  diarias: z.number().int().optional(),
  checkin: z.string().datetime().optional(),
})

export const createExpenseParamsSchema = z.object({
  reportId: z.coerce.number().int()
})