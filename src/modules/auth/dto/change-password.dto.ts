// src/modules/auth/dto/change-password.dto.ts
import { z } from 'zod'

export const changePasswordBodySchema = z.object({
  newPassword: z.string().min(6, 'A nova senha precisa ter no mínimo 6 caracteres.'),
})
