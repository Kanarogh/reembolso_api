// src/hooks/role.hook.ts

import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { authHook } from './auth.hook.js'

// 1. Mapeamos a hierarquia. Números menores são mais poderosos.
const roleHierarchy: Record<Role, number> = {
  ADM: 1,
  RH: 2,
  FINANCEIRO: 2, // Mesmo nível do RH
  GESTOR: 3,
  COLABORADOR: 4,
}

// 2. A função agora recebe o "papel mínimo" necessário para acessar a rota
export const verifyRole = (requiredRole: Role) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // 3. Primeiro, garantimos que o usuário está autenticado, chamando o outro hook
    await authHook(request, reply)

    // Se a autenticação falhar, o código abaixo não será executado.
    const userRole = request.user?.role as Role

    if (!userRole) {
        return reply.status(403).send({ message: 'Acesso negado. Papel do usuário não identificado.' })
    }

    const userLevel = roleHierarchy[userRole];
    const requiredLevel = roleHierarchy[requiredRole];

    // 4. Comparamos os níveis: se o nível do usuário for menor ou igual
    // ao nível exigido, ele tem permissão.
    if (userLevel > requiredLevel) {
      return reply.status(403).send({ message: 'Acesso negado. Permissões insuficientes.' })
    }
  }
}
