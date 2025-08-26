// src/modules/users/users.controller.ts
import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { createUserBodySchema } from './dto/create-user.dto.js'
import { updateUserBodySchema, updateUserParamsSchema } from './dto/update-user.dto.js'
import { UsersService } from './users.services.js'


export class UsersController {
  private usersService = new UsersService()

  async list(request: FastifyRequest, reply: FastifyReply) {
     const currentUser = {
    id: Number(request.user!.sub),
    role: request.user!.role as Role,
  }
     try {
      // 2. PASSAMOS O ID PARA O SERVIÇO
      const { users } = await this.usersService.list(currentUser)
      return reply.status(200).send({ data: users })
    } catch (error) {
      return reply.status(500).send({ message: 'Erro interno do servidor.' })
    }

  }

  // Método para a criação de novos usuários
  async create(request: FastifyRequest, reply: FastifyReply) {
    const userData = createUserBodySchema.parse(request.body)
    try {
      const { user } = await this.usersService.create(userData)

      // Lembre-se de nunca retornar o hash da senha
      const { passwordHash: _, ...userWithoutPassword } = user

      return reply.status(201).send({ data: userWithoutPassword })
    } catch (error) {
      if (error instanceof Error && error.message.includes('cadastrado')) {
        return reply.status(409).send({ message: error.message }) // 409 Conflict
      }
      // Lançar outros erros para um tratamento mais genérico
      throw error
    }
  }
  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = updateUserParamsSchema.parse(request.params)
    const userData = updateUserBodySchema.parse(request.body)
    try {
      const { user } = await this.usersService.update(id, userData)
      const { passwordHash: _, ...userWithoutPassword } = user
      return reply.status(200).send({ data: userWithoutPassword })
    } catch (error) {
      if (error instanceof Error) {
         // Pode ser erro de e-mail em uso (409) ou usuário não encontrado (404)
        return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  }

    async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = updateUserParamsSchema.parse(request.params)
    const currentUserId = Number(request.user!.sub)

    try {
      await this.usersService.delete(id, currentUserId)
      return reply.status(204).send() // 204 No Content
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ message: error.message })
      }
      throw error
    }
  }
}
