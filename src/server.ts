// src/server.ts

// src/server.ts

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
export const prisma = new PrismaClient()

// Registra as rotas do módulo de autenticação
app.register(authRoutes, { prefix: '/auth' })
app.register(reportsRoutes, { prefix: '/reports' }) // <-- 2. Registrar rotas de relatórios
app.register(approvalsRoutes, { prefix: '/approvals' }) // <-- 3. Registrar rotas de aprovações
app.register(usersRoutes, { prefix: '/users' }) // <-- 4. Registrar rotas de usuários

const PORT = env.PORT // <-- 2.

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    console.log(`🚀 Servidor HTTP rodando em http://localhost:${env.PORT}`)
  } catch (err) {
    console.error('Erro ao iniciar o servidor:', err)
    process.exit(1)
  }
}

start()
