// src/modules/users/users.service.ts

import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs'; // <-- 1. PRECISAMOS IMPORTAR O BCRYPT
import { z } from 'zod'; // <-- 2. PRECISAMOS IMPORTAR O ZOD
import { prisma } from '../../server.js';
import { createUserBodySchema } from './dto/create-user.dto.js';
import { updateUserBodySchema } from './dto/update-user.dto.js';
// <-- 3. PRECISAMOS IMPORTAR NOSSO DTO

// 4. DEFINIMOS O TIPO A PARTIR DO SCHEMA DO DTO
type CreateUserRequest = z.infer<typeof createUserBodySchema>
type UpdateUserRequest = z.infer<typeof updateUserBodySchema>

export class UsersService {
   async list(currentUser: { id: number; role: Role }) {
    // A condição base continua a mesma: buscar usuários ativos e que não sejam o próprio usuário.
    const whereCondition: any = {
      deactivatedAt: null,
      id: {
        not: currentUser.id,
      },
    }

    // AQUI ESTÁ A NOVA REGRA DE NEGÓCIO:
    // Se o usuário que está fazendo a requisição for um GESTOR,
    // adicionamos um filtro extra para mostrar apenas COLABORADORES.
    if (currentUser.role === 'GESTOR') {
      whereCondition.role = 'COLABORADOR';
    }
// NOVA REGRA para RH/FINANCEIRO
    if (currentUser.role === 'RH' || currentUser.role === 'FINANCEIRO') {
      // Eles podem ver todos, EXCETO os ADMs.
      whereCondition.role = { not: 'ADM' };
    }
    // Se o usuário for RH ou ADM, a condição extra não é adicionada,
    // e eles continuarão vendo todos os outros usuários.

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    return { users }
  }

  // MÉTODO 'create' CORRIGIDO
  async create({ name, email, password, role }: CreateUserRequest) {
    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    })
    if (userWithSameEmail) {
      throw new Error('E-mail já cadastrado.')
    }

    // 5. CRIPTOGRAFAMOS A SENHA ANTES DE SALVAR
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash, // <-- 6. USAMOS O CAMPO CORRETO (passwordHash)
        role,
        mustChangePassword: true,
      },
    })

    return { user }
  }
async update(userId: number, data: UpdateUserRequest) {
    // Garante que o usuário que queremos editar existe
    await prisma.user.findUniqueOrThrow({ where: { id: userId } })

    // Se o e-mail estiver sendo alterado, verifica se o novo e-mail já não está em uso
    if (data.email) {
      const emailInUse = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId },
        },
      })
      if (emailInUse) {
        throw new Error('Este e-mail já está em uso por outro usuário.')
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: data,
    })

    return { user: updatedUser }
  }


   async delete(userIdToDelete: number, currentUserId: number) {
    if (userIdToDelete === currentUserId) {
      throw new Error('Você não pode desativar sua própria conta.')
    }

    await prisma.user.update({
      where: { id: userIdToDelete },
      data: {
        deactivatedAt: new Date(), // Marcamos a data e hora da desativação
      },
    })
  }
}
