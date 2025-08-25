import { z } from 'zod'
import { prisma } from '../../server.js'
import { createReportBodySchema } from './dto/create-report.dto.js'

type CreateReportRequest = z.infer<typeof createReportBodySchema> & {
  userId: number
}

export class ReportsService {
  async create({ userId, periodFrom, periodTo, client }: CreateReportRequest) {
    const report = await prisma.report.create({
      data: {
        userId,
        periodFrom,
        periodTo,
        client,
        // O status 'DRAFT' é o padrão, conforme o schema.prisma
      },
    })
    return { report }
  }
   async listByUser(userId: number) {
    const reports = await prisma.report.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc', // Mostra os mais recentes primeiro
      },include: {
      expenses: true, // <-- ADICIONAMOS AQUI TAMBÉM
    },
    })

    return { reports }
  }
  async findById(reportId: number, userId: number) {
    // Busca por um relatório que tenha o ID E o userId correspondentes
    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
        userId: userId, // ESSA LINHA É A GARANTIA DE SEGURANÇA
      },include: {
      expenses: true, // <-- ADICIONAMOS AQUI TAMBÉM
    },
    })

    if (!report) {
      // Lança um erro se o relatório não for encontrado ou não pertencer ao usuário
      throw new Error('Relatório não encontrado.')
    }

    return { report }
  }
  async delete(reportId: number, userId: number) {
    // 1. Garante que o relatório existe, pertence ao usuário e está em modo Rascunho
    await prisma.report.findFirstOrThrow({
      where: {
        id: reportId,
        userId: userId,
        status: 'DRAFT',
      },
    })

    // 2. Apaga o relatório
    // Graças ao 'onDelete: Cascade', o Prisma irá apagar todas as despesas e aprovações junto.
    await prisma.report.delete({
      where: {
        id: reportId,
      },
    })

    // Para DELETE, não precisamos retornar nada.
  }
}