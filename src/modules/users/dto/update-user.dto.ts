// src/modules/users/dto/update-user.dto.ts
import { Role } from '@prisma/client'
import { z } from 'zod'

export const updateUserParamsSchema = z.object({
  id: z.coerce.number().int(),
})

export const updateUserBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
})
