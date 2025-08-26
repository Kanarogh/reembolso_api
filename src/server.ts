// src/server.ts

// src/server.ts

<<<<<<< HEAD
import fastify from 'fastify'
import { PrismaClient } from '@prisma/client'
// Caminho atualizado para o módulo de autenticação
import { authRoutes } from './modules/auth/auth.routes.js'
import { reportsRoutes } from './modules/reports/reports.routes.js'
import { env } from './env/index.js' 
export const app = fastify()
=======
import cors from '@fastify/cors'; // <-- 1. IMPORTAR
import multipart from '@fastify/multipart'; // <-- 1. IMPORTAR
import fastifyStatic from '@fastify/static'; // <-- 1. IMPORTAR

import { PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import path from 'path'; // <-- 2. IMPORTAR
// Caminho atualizado para o módulo de autenticação
import { fileURLToPath } from 'url';
import { env } from './env/index.js';
import { approvalsRoutes } from './modules/approvals/approvals.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const app = fastify()
// 1. REGISTRAMOS O PLUGIN DE MULTIPART PRIMEIRO COM OPÇÕES
app.register(cors, {
  origin: '*', // Em produção, mude para o domínio do seu frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // <-- ADICIONE ESTA LINHA
})// 4. REGISTRAR O SERVIDOR DE ARQUIVOS ESTÁTICOS

app.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'uploads'), // Aponta para a pasta 'uploads'
  prefix: '/uploads/', // Faz com que os arquivos sejam acessíveis via http://.../uploads/
})
app.register(multipart, {
  limits: {
    fileSize: 1024 * 1024 * 5, // Limite de 5 megabytes (MB)
  },
})
>>>>>>> 9cabe6f (conectouuuu)
export const prisma = new PrismaClient()

// Registra as rotas do módulo de autenticação
app.register(authRoutes, { prefix: '/auth' })
app.register(reportsRoutes, { prefix: '/reports' }) // <-- 2. Registrar rotas de relatórios
<<<<<<< HEAD

=======
app.register(approvalsRoutes, { prefix: '/approvals' }) // <-- 3. Registrar rotas de aprovações
app.register(usersRoutes, { prefix: '/users' }) // <-- 4. Registrar rotas de usuários
>>>>>>> 9cabe6f (conectouuuu)

const PORT = env.PORT // <-- 2.

const start = async () => {
  try {
<<<<<<< HEAD
    await app.listen({ port: PORT })
    console.log(`Server is running on http://localhost:${PORT}`)
  } catch (error) {
    console.error('Error starting server:', error)
=======
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    console.log(`🚀 Servidor HTTP rodando em http://localhost:${env.PORT}`)
  } catch (err) {
    console.error('Erro ao iniciar o servidor:', err)
>>>>>>> 9cabe6f (conectouuuu)
    process.exit(1)
  }
}

<<<<<<< HEAD
start()
=======
start()
>>>>>>> 9cabe6f (conectouuuu)
