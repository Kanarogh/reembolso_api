// src/modules/reports/expenses.service.ts

import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'
import { prisma } from '../../server.js'
import { PolicyEngineService } from '../../services/policy-engine.service.js'
import { updateExpenseBodySchema } from '../reports/dto/update-expense.dto.js'
import { createExpenseBodySchema } from './dto/create-expense.dto.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// CORREÇÃO 1: Caminho da importação ajustado

type CreateExpenseRequest = z.infer<typeof createExpenseBodySchema> & {
  reportId: number
  userId: number
}
type UpdateExpenseRequest = z.infer<typeof updateExpenseBodySchema>

interface AddAttachmentRequest {
  ids: { reportId: number; expenseId: number; userId: number }
  file: {
    fileName: string
    mimetype: string
    buffer: Buffer
  }
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
  // NOVO MÉTODO
// GARANTA QUE SEU MÉTODO UPDATE ESTEJA ASSIM
  async update(
    ids: { reportId: number; expenseId: number; userId: number },
    data: UpdateExpenseRequest,
  ) {
    const originalExpense = await prisma.expense.findFirstOrThrow({
      where: {
        id: ids.expenseId,
        reportId: ids.reportId,
        report: {
          userId: ids.userId,
          status: { in: ['DRAFT', 'ADJUSTMENT_REQUESTED'] },
        },
      },
    })

    const newExpenseData = { ...originalExpense, ...data }

    const { valorConsiderado: newValorConsiderado, policyNotes } =
      this.policyEngine.calculateConsideredValue(newExpenseData)

    const gastoDifference =
      (data.valorGasto ?? originalExpense.valorGasto) -
      originalExpense.valorGasto
    const consideradoDifference =
      newValorConsiderado - originalExpense.valorConsiderado

    const [, updatedReport] = await prisma.$transaction([
      prisma.expense.update({
        where: { id: ids.expenseId },
        data: {
          ...data,
          valorConsiderado: newValorConsiderado,
          policyNotes,
        },
      }),
      prisma.report.update({
        where: { id: ids.reportId },
        data: {
          totalGasto: { increment: gastoDifference },
          totalConsiderado: { increment: consideradoDifference },
        },
        include: { expenses: true, approvals: true },
      }),
    ])

    return { report: updatedReport }
  }

   async addAttachment({ ids, file }: AddAttachmentRequest) {
    // 1. Garante que a despesa existe e pertence ao usuário
    const expense = await prisma.expense.findFirstOrThrow({
      where: {
        id: ids.expenseId,
        reportId: ids.reportId,
        report: { userId: ids.userId },
      },
    })

    // 2. Cria um nome de arquivo único para evitar colisões
    const fileId = randomUUID()
    const fileExtension = path.extname(file.fileName)
    const newFileName = fileId.concat(fileExtension)

    // 3. Define o caminho e salva o arquivo no disco
    // Conforme o escopo, para desenvolvimento, salvamos localmente
    const uploadDir = path.resolve(__dirname, '..', '..', '..', 'uploads', String(ids.reportId))
    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, newFileName)
    await fs.writeFile(filePath, file.buffer)

     const relativePath = `${ids.reportId}/${newFileName}`
    // 4. Cria o registro do anexo no banco de dados
    const attachment = await prisma.attachment.create({
      data: {
        expenseId: ids.expenseId,
        fileName: file.fileName, // Nome original
        path: relativePath, // Caminho no servidor
        contentType: file.mimetype,
        size: file.buffer.length,
      },
    })

    return { attachment }
  }
}
