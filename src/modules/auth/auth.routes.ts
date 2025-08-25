// src/modules/auth/auth.routes.ts

import { FastifyInstance } from 'fastify'
import { AuthController } from './auth.controller.js'

export async function authRoutes(app: FastifyInstance) {
  const authController = new AuthController()

  app.post('/register', (req, rep) => authController.register(req, rep))
  app.post('/login', (req, rep) => authController.login(req, rep))
  app.post('/refresh-token', (req, rep) => authController.refreshToken(req, rep))
}