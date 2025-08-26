import { FastifyReply, FastifyRequest } from 'fastify'

import { updateExpenseBodySchema, updateExpenseParamsSchema } from '../reports/dto/update-expense.dto.js'
import { createExpenseBodySchema, createExpenseParamsSchema } from './dto/create-expense.dto.js'
import { deleteExpenseParamsSchema } from './dto/delete-expense.dto.js'
import { ExpensesService } from './expenses.services.js'

export class ExpensesController {
  private expensesService = new ExpensesService()

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { reportId } = createExpenseParamsSchema.parse(request.params)
    const expenseData = createExpenseBodySchema.parse(request.body)
    const userId = Number(request.user!.sub)

    try {
      const { report } = await this.expensesService.create({
        ...expenseData,
        reportId,
        userId
      })
      return reply.status(201).send({ data: report })
    } catch (error) {
      if (error instanceof Error) return reply.status(400).send({ message: error.message })
      throw error
    }
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { reportId, expenseId } = deleteExpenseParamsSchema.parse(request.params)
    const userId = Number(request.user!.sub)

    try {
      const { report } = await this.expensesService.delete(reportId, expenseId, userId)
      return reply.status(200).send({ data: report })
    } catch (error) {
      if (error instanceof Error) return reply.status(404).send({ message: 'Despesa não encontrada ou relatório não permite edição.' })
      throw error
    }
  }
   async update(request: FastifyRequest, reply: FastifyReply) {
    const { reportId, expenseId } = updateExpenseParamsSchema.parse(request.params)
    const data = updateExpenseBodySchema.parse(request.body)
    const userId = Number(request.user!.sub)

    try {
      const { report } = await this.expensesService.update(
        { reportId, expenseId, userId },
        data
      )
      return reply.status(200).send({ data: report })
    } catch (error) {
      if (error instanceof Error) return reply.status(400).send({ message: error.message })
      throw error
    }
  }
  // NOVO MÉTODO
  async addAttachment(request: FastifyRequest, reply: FastifyReply) {
    const { reportId, expenseId } = updateExpenseParamsSchema.parse(request.params)
    const userId = Number(request.user!.sub)

    const file = await request.file()
    if (!file) {
      return reply.status(400).send({ message: 'Nenhum arquivo enviado.' })
    }

    const buffer = await file.toBuffer()

    try {
      const { attachment } = await this.expensesService.addAttachment({
        ids: { reportId, expenseId, userId },
        file: {
          fileName: file.filename,
          mimetype: file.mimetype,
          buffer,
        },
      })
      return reply.status(201).send({ data: attachment })
    } catch (error) {
      if (error instanceof Error) return reply.status(400).send({ message: error.message })
      throw error
    }
  }
}
