// src/hooks/role.hook.ts
import type { Role } from '@prisma/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { authHook } from './auth.hook.js'

// Hierarquia: número menor = mais poder
const roleHierarchy: Record<Role, number> = {
  ADM: 1,
  RH: 2,
  FINANCEIRO: 2,
  GESTOR: 3,
  COLABORADOR: 4,
}

/**
 * Aceita:
 *  - um papel mínimo (ex.: 'GESTOR') -> usuário precisa ter nível <= exigido
 *  - uma lista de papéis permitidos (ex.: ['GESTOR','RH','FINANCEIRO'])
 */
export const verifyRole =
  (required: Role | Role[]) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    // garante autenticação e popula request.user
    await authHook(request, reply)

    const userRole = request.user?.role as Role | undefined
    if (!userRole) {
      return reply.status(403).send({ message: 'Acesso negado. Papel do usuário não identificado.' })
    }

    // ADM sempre pode
    if (userRole === 'ADM') return

    if (Array.isArray(required)) {
      // lista explícita de papéis
      if (!required.includes(userRole)) {
        return reply.status(403).send({ message: 'Acesso negado. Permissões insuficientes.' })
      }
      return
    }

    // papel mínimo pela hierarquia
    const userLevel = roleHierarchy[userRole]
    const requiredLevel = roleHierarchy[required]
    if (userLevel > requiredLevel) {
      return reply.status(403).send({ message: 'Acesso negado. Permissões insuficientes.' })
    }
  }
