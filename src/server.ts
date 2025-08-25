// src/server.ts

// src/server.ts

import fastify from 'fastify'
import { PrismaClient } from '@prisma/client'
// Caminho atualizado para o módulo de autenticação
import { authRoutes } from './modules/auth/auth.routes.js'
import { reportsRoutes } from './modules/reports/reports.routes.js'
import { env } from './env/index.js' 
export const app = fastify()
export const prisma = new PrismaClient()

// Registra as rotas do módulo de autenticação
app.register(authRoutes, { prefix: '/auth' })
app.register(reportsRoutes, { prefix: '/reports' }) // <-- 2. Registrar rotas de relatórios


const PORT = env.PORT // <-- 2.

const start = async () => {
  try {
    await app.listen({ port: PORT })
    console.log(`Server is running on http://localhost:${PORT}`)
  } catch (error) {
    console.error('Error starting server:', error)
    process.exit(1)
  }
}

start()