import { ReportStatus, Role } from "@prisma/client";
import dayjs from "dayjs";
import { z } from "zod";
import { prisma } from "../../server.js";
import { createReportBodySchema } from "./dto/create-report.dto.js";

type CreateReportRequest = z.infer<typeof createReportBodySchema> & {
  userId: number;
};

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
    });
    return { report };
  }
  // src/modules/reports/reports.service.ts

  // src/modules/reports/reports.service.ts

  async list(
    user: { id: number; role: Role },
    status?: ReportStatus | ReportStatus[]
  ) {
    let whereCondition: any =
      user.role === "COLABORADOR"
        ? { userId: user.id } // Se for COLABORADOR, começa filtrando por seu ID
        : {}; // Para outros papéis, começa sem filtro de usuário

    // Se um status (ou uma lista de status) for passado, adiciona ao filtro
    if (status) {
      // Se 'status' for uma lista, usamos o filtro 'in' do Prisma
      if (Array.isArray(status)) {
        whereCondition.status = { in: status };
      } else {
        // Se for apenas um, usamos a igualdade simples
        whereCondition.status = status;
      }
    }

    // REGRA ESPECIAL PARA O ADMIN:
    // Se o usuário for ADM, ele deve ver tudo. Nós limpamos os filtros de usuário
    // e mantemos apenas o de status, se houver.
    if (user.role === "ADM") {
      if (status) {
        whereCondition = Array.isArray(status)
          ? { status: { in: status } }
          : { status };
      } else {
        whereCondition = {};
      }
    }

    const reports = await prisma.report.findMany({
      where: whereCondition,
      include: {
        // Mantemos a busca do nome do usuário
        user: {
          select: {
            name: true,
          },
        },
        // E também a busca das despesas
        expenses: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { reports };
  }
  // MÉTODO 'findById' ATUALIZADO COM A LÓGICA DE PERMISSÃO
  async findById(reportId: number, user: { id: number; role: Role }) {
    const whereCondition: any = {
      id: reportId,
    };

    // Se o usuário for um colaborador, ele só pode ver o seu próprio relatório
    if (user.role === "COLABORADOR") {
      whereCondition.userId = user.id;
    }
    // Se for GESTOR, RH ou ADM, ele pode ver o relatório de qualquer um

    const report = await prisma.report.findFirst({
      where: whereCondition,
      include: {
        expenses: {
          // <-- AQUI DENTRO
          include: {
            attachments: true, // <-- ADICIONE ESTE INCLUDE
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        approvals: true,
      },
    });

    if (!report) {
      throw new Error(
        "Relatório não encontrado ou você não tem permissão para visualizá-lo."
      );
    }

    return { report };
  }
  async delete(reportId: number, userId: number) {
    // 1. Garante que o relatório existe, pertence ao usuário e está em modo Rascunho
    await prisma.report.findFirstOrThrow({
      where: {
        id: reportId,
        userId: userId,
        status: "DRAFT",
      },
    });

    // 2. Apaga o relatório
    // Graças ao 'onDelete: Cascade', o Prisma irá apagar todas as despesas e aprovações junto.
    await prisma.report.delete({
      where: {
        id: reportId,
      },
    });

    // Para DELETE, não precisamos retornar nada.
  }

  async submit(reportId: number, userId: number) {
    // Garante que o relatório existe, pertence ao usuário e está em modo Rascunho
    await prisma.report.findFirstOrThrow({
      where: {
        id: reportId,
        userId,
        status: { in: ["DRAFT", "ADJUSTMENT_REQUESTED"] }, // <-- MUDANÇA AQUI
      },
    });

    const submissionDate = new Date();
    const expectedPaymentDate =
      this._calculateExpectedPaymentDate(submissionDate);

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "SUBMITTED",
        submissionDate: submissionDate,
        expectedPaymentDate: expectedPaymentDate,
      },
      include: {
        expenses: true,
      },
    });

    return { report: updatedReport };
  }

  // Método privado para a regra de negócio do pagamento
  private _calculateExpectedPaymentDate(submissionDate: Date): Date {
    const submissionDay = dayjs(submissionDate).date();
    let paymentDate = dayjs(submissionDate);

    if (submissionDay <= 11) {
      // Se enviado até o dia 11, paga no dia 26 do mesmo mês [cite: 84]
      paymentDate = paymentDate.date(26);
    } else {
      // Se enviado depois do dia 11, paga no dia 11 do mês seguinte [cite: 85]
      paymentDate = paymentDate.add(1, "month").date(11);
    }

    // TODO: Adicionar lógica para pular fins de semana/feriados
    return paymentDate.toDate();
  }

  async updateStatus(reportId: number, newStatus: ReportStatus) {
    // Busca o relatório para verificar o status atual
    const report = await prisma.report.findUniqueOrThrow({
      where: { id: reportId },
    });

    // Regras de transição de status
    const allowedTransitions: Partial<Record<ReportStatus, ReportStatus[]>> = {
      APPROVED_MANAGER: ["VALIDATED_HR"],
      VALIDATED_HR: ["PAID"],
    };

    const canTransition =
      allowedTransitions[report.status]?.includes(newStatus);

    if (!canTransition) {
      throw new Error(
        `Não é possível mudar o status de '${report.status}' para '${newStatus}'.`
      );
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status: newStatus },
    });

    return { report: updatedReport };
  }
}
