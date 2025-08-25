// src/hooks/auth.hook.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken' // Mude para o default import
import { env } from '../env/index.js'

declare module 'fastify' {
  export interface FastifyRequest {
    user?: {
      sub: string
      role: string
      email: string
    }
  }
}

export const authHook = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    return reply
      .status(401)
      .send({ message: 'Token de autenticação não fornecido.' })
  }

  const [, token] = authHeader.split(' ')

  try {
    // A MUDANÇA ESTÁ AQUI
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'], // 1. Especificamos o algoritmo esperado
    })

    // 2. Garantimos que o payload decodificado tenha o formato que esperamos
    if (typeof decoded === 'string' || !decoded.sub) {
        throw new Error("Formato de token inválido")
    }

    request.user = {
      sub: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    }
  } catch (err) {
    // Adicionamos um log para nos ajudar a ver o erro exato no terminal
    console.error('Falha na verificação do JWT:', err) 
    return reply.status(401).send({ message: 'Token inválido.' })
  }
}