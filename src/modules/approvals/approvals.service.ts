import { ReportStatus } from '@prisma/client'
import { prisma } from '../../server.js'

interface CreateApprovalRequest {
  reportId: number
  decision: 'Approved' | 'Rejected' | 'AdjustmentRequested'
  comment?: string
  approver: {
    id: number
    name: string
  }
}

export class ApprovalsService {
  async create({ reportId, decision, comment, approver }: CreateApprovalRequest) {
    // 1. Encontra o relatório e garante que ele está 'SUBMITTED'
    const reportToApprove = await prisma.report.findFirstOrThrow({
      where: { id: reportId, status: 'SUBMITTED' },
    })

    // 2. Mapeia a decisão para o novo status do relatório
    const statusMap = {
      Approved: 'APPROVED_MANAGER',
      Rejected: 'REJECTED',
      AdjustmentRequested: 'ADJUSTMENT_REQUESTED',
    }
    const newStatus = statusMap[decision] as ReportStatus

    // 3. Atualiza o relatório e cria o registro de aprovação em uma transação
    const [, updatedReport] = await prisma.$transaction([
      prisma.approvalStep.create({
        data: {
          reportId: reportId,
          approverId: String(approver.id), // ApprovalStep espera string para IDs por enquanto
          approverName: approver.name,
          decision,
          comment,
        },
      }),
      prisma.report.update({
        where: { id: reportId },
        data: { status: newStatus },
        include: { expenses: true, approvals: true },
      }),
    ])

    return { report: updatedReport }
  }
}
