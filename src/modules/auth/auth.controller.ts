// src/modules/auth/auth.controller.ts

import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { AuthService } from './auth.service.js'
import { changePasswordBodySchema } from './dto/change-password.dto.js'
import { loginBodySchema } from './dto/login.dto.js'
import { registerBodySchema } from './dto/register.dto.js'

export class AuthController {
  private authService = new AuthService()

  async register(request: FastifyRequest, reply: FastifyReply) {
    const { name, email, password } = registerBodySchema.parse(request.body)
    try {
      const { user } = await this.authService.register({ name, email, password })
      const { passwordHash: _, ...userWithoutPassword } = user
      return reply.status(201).send({ data: { ok: true, user: userWithoutPassword } })
    } catch (error) {
      if (error instanceof Error) return reply.status(409).send({ message: error.message })
      throw error
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = loginBodySchema.parse(request.body)
    try {
      const { user, accessToken, refreshToken } = await this.authService.login({ email, password })
      const { passwordHash: _, ...userWithoutPassword } = user
      return reply.status(200).send({ data: { user: userWithoutPassword, accessToken, refreshToken } })
    } catch (error) {
      if (error instanceof Error) return reply.status(400).send({ message: error.message })
      throw error
    }
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const refreshTokenBodySchema = z.object({ refreshToken: z.string() })
    const { refreshToken } = refreshTokenBodySchema.parse(request.body)
    try {
      const { accessToken } = await this.authService.refreshToken(refreshToken)
      return reply.status(200).send({ data: { accessToken } })
    } catch (error) {
      if (error instanceof Error) return reply.status(401).send({ message: error.message })
      throw error
    }
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
        const { newPassword } = changePasswordBodySchema.parse(request.body)
        const userId = Number(request.user!.sub)

        try {
            await this.authService.changePassword(userId, { newPassword })
            return reply.status(204).send() // 204 No Content
        } catch (error) {
            if (error instanceof Error) return reply.status(400).send({ message: error.message })
            throw error
        }
    }
}
