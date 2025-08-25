// src/modules/reports/expenses.service.ts

import { prisma } from '../../server.js'
import { z } from 'zod'
import { createExpenseBodySchema } from './dto/create-expense.dto.js'
import { PolicyEngineService } from '../../services/policy-engine.service.js'
// CORREÇÃO 1: Caminho da importação ajustado

type CreateExpenseRequest = z.infer<typeof createExpenseBodySchema> & {
  reportId: number
  userId: number
}

export class ExpensesService {
  private policyEngine = new PolicyEngineService()

  async create(data: CreateExpenseRequest) {
    const report = await prisma.report.findFirstOrThrow({
      where: {
        id: data.reportId,
        userId: data.userId,
        status: { in: ['DRAFT', 'ADJUSTMENT_REQUESTED'] },
      },
    })

    const { valorConsiderado, policyNotes } =
      this.policyEngine.calculateConsideredValue(data)

    // CORREÇÃO 2: Passando os dados de forma explícita, sem o userId
    const expenseDataToCreate = {
      data: data.data,
      tipo: data.tipo,
      descricao: data.descricao,
      valorGasto: data.valorGasto,
      local: data.local,
      mealType: data.mealType,
      foraDoMunicipio: data.foraDoMunicipio,
      contemItensProibidos: data.contemItensProibidos,
      diarias: data.diarias,
      checkin: data.checkin,
    }

    const [, updatedReport] = await prisma.$transaction([
      prisma.expense.create({
        data: {
          ...expenseDataToCreate, // Agora passamos apenas os dados relevantes
          reportId: data.reportId,
          valorConsiderado,
          policyNotes,
        },
      }),
      prisma.report.update({
        where: { id: data.reportId },
        data: {
          totalGasto: { increment: data.valorGasto },
          totalConsiderado: { increment: valorConsiderado },
        },include: {
      expenses: true, // <-- A MÁGICA ACONTECE AQUI
    },
      }),
    ])

    return { report: updatedReport }
  }
  async delete(reportId: number, expenseId: number, userId: number) {
    // 1. Busca a despesa para garantir que ela existe e pertence ao relatório/usuário correto
    // Estando o relatório em um status que permite edição.
    // Se não encontrar, o findFirstOrThrow já retorna um erro.
    const expenseToDelete = await prisma.expense.findFirstOrThrow({
      where: {
        id: expenseId,
        reportId: reportId,
        report: {
          userId: userId,
          status: { in: ['DRAFT', 'ADJUSTMENT_REQUESTED'] },
        },
      },
    })

    // 2. Apaga a despesa e atualiza os totais do relatório em uma transação
    const [, updatedReport] = await prisma.$transaction([
      prisma.expense.delete({
        where: {
          id: expenseId,
        },
      }),
      prisma.report.update({
        where: { id: reportId },
        data: {
          totalGasto: { decrement: expenseToDelete.valorGasto },
          totalConsiderado: { decrement: expenseToDelete.valorConsiderado },
        },
        include: {
          expenses: true, // Já retornamos o relatório com a lista de despesas atualizada
        },
      }),
    ])

    return { report: updatedReport }
  }
}