import { FastifyReply, FastifyRequest } from 'fastify'
import { ApprovalsService } from './approvals.service.js'
import { createApprovalBodySchema, createApprovalParamsSchema } from './dto/create-approval.dto.js'

export class ApprovalsController {
  private approvalsService = new ApprovalsService()

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { reportId } = createApprovalParamsSchema.parse(request.params)
    const { decision, comment } = createApprovalBodySchema.parse(request.body)
    const approver = {
      id: Number(request.user!.sub),
      name: 'Nome do Gestor (Placeholder)', // No futuro, buscaríamos o nome no banco
    }

    try {
      const { report } = await this.approvalsService.create({
        reportId, decision, comment, approver
      })
      return reply.status(201).send({ data: report })
    } catch (error) {
      if (error instanceof Error) return reply.status(400).send({ message: error.message })
      throw error
    }
  }
}
