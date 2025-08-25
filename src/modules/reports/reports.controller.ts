import { FastifyRequest, FastifyReply } from 'fastify'
import { createReportBodySchema } from './dto/create-report.dto.js'
import { ReportsService } from './reports.service.js'
import { getReportParamsSchema } from './dto/get-report.dto.js'

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
    const userId = Number(request.user!.sub) // Pega o ID do usuário logado (do token)

    try {
      const { reports } = await this.reportsService.listByUser(userId)
      return reply.status(200).send({ data: reports })

    } catch (error) {
      return reply.status(500).send({ message: 'Erro interno do servidor.' })
    }
  }
  async findById(request: FastifyRequest, reply: FastifyReply) {
    // Valida e extrai o ID dos parâmetros da URL
    const { id } = getReportParamsSchema.parse(request.params)
    const userId = Number(request.user!.sub) 

    try {
      const { report } = await this.reportsService.findById(id, userId)
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
}