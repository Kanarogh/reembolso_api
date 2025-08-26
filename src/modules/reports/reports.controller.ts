import { ReportStatus, Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import z from 'zod'
import { createReportBodySchema } from './dto/create-report.dto.js'
import { getReportParamsSchema } from './dto/get-report.dto.js'
import { updateReportStatusBodySchema, updateReportStatusParamsSchema } from './dto/update-report-status.dto.js'
import { ReportsService } from './reports.service.js'

export class ReportsController {
  private reportsService = new ReportsService()

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { periodFrom, periodTo, client } = createReportBodySchema.parse(request.body)

    // request.user vem do nosso authHook!
    const userId = Number(request.user!.sub)

    try {
      const { report } = await this.reportsService.create({
        userId,
        periodFrom,
        periodTo,
        client,
      })
      return reply.status(201).send({ data: report })
    } catch (error) {
      // Tratamento de erro genérico por enquanto
      return reply.status(500).send({ message: 'Erro interno do servidor.' })
    }
  }


 async list(request: FastifyRequest, reply: FastifyReply) {
    // 1. Schema do Zod para validar a query da URL
    const listQuerySchema = z.object({
      // O status pode ser um valor único ou um array de valores
      status: z.union([z.nativeEnum(ReportStatus), z.array(z.nativeEnum(ReportStatus))]).optional(),
    });

    // 2. Validamos e extraímos o status da requisição
    const { status } = listQuerySchema.parse(request.query);

    const user = {
      id: Number(request.user!.sub),
      role: request.user!.role as Role,
    }

    try {
      // 3. Passamos o 'user' e o 'status' validado para o serviço
      const { reports } = await this.reportsService.list(user, status)
      return reply.status(200).send({ data: reports })
    } catch (error) {
      return reply.status(500).send({ message: 'Erro interno do servidor.' })
    }
  }
  async findById(request: FastifyRequest, reply: FastifyReply) {
    // Valida e extrai o ID dos parâmetros da URL
    const { id } = getReportParamsSchema.parse(request.params)

    // 1. Montamos o objeto completo do usuário logado
    const user = {
      id: Number(request.user!.sub),
      role: request.user!.role as Role,
    };

    try {
      // 2. Passamos o ID do relatório e o objeto 'user' para o serviço
      const { report } = await this.reportsService.findById(id, user)
      return reply.status(200).send({ data: report })
    } catch (error) {
      if (error instanceof Error && error.message.includes('encontrado')) {
        return reply.status(404).send({ message: error.message }) // 404 Not Found
      }
      return reply.status(500).send({ message: 'Erro interno do servidor.' })
    }
  }


  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = getReportParamsSchema.parse(request.params)
    const userId = Number(request.user!.sub)

    try {
      await this.reportsService.delete(id, userId)
      // Status 204 No Content é a resposta padrão para um DELETE bem-sucedido
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error) return reply.status(404).send({ message: 'Relatório não encontrado ou não pode ser apagado.' })
      throw error
    }
  }
  async submit(request: FastifyRequest, reply: FastifyReply) {
    const { id } = getReportParamsSchema.parse(request.params)
    const userId = Number(request.user!.sub)

    try {
      const { report } = await this.reportsService.submit(id, userId)
      return reply.status(200).send({ data: report })
    } catch (error) {
      if (error instanceof Error) return reply.status(404).send({ message: 'Relatório não encontrado ou não pode ser submetido.' })
      throw error
    }
  }
  async updateStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = updateReportStatusParamsSchema.parse(request.params)
    const { status } = updateReportStatusBodySchema.parse(request.body)

    try {
      const { report } = await this.reportsService.updateStatus(id, status)
      return reply.status(200).send({ data: report })
    } catch (error) {
      if (error instanceof Error) return reply.status(400).send({ message: error.message })
      throw error
    }
  }
}
