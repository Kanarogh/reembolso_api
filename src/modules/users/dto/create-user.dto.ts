// src/modules/users/dto/create-user.dto.ts

import { Role } from '@prisma/client'
import { z } from 'zod'

export const createUserBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6, 'A senha precisa ter no mínimo 6 caracteres.'),
  role: z.nativeEnum(Role), // Garante que o papel seja um dos definidos no nosso schema
})
