// src/env/index.ts
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
  PORT: z.coerce.number().default(3333),
  JWT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  // Aceita número (segundos) OU string estilo "15m", "7d"
  ACCESS_TOKEN_EXPIRES_IN: z.union([z.coerce.number(), z.string()]).default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.union([z.coerce.number(), z.string()]).default('7d'),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas!', parsed.error.format())
  throw new Error('Variáveis de ambiente inválidas.')
}

export const env = parsed.data
