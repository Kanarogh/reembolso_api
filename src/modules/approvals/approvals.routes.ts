import { FastifyInstance } from 'fastify'
import { verifyRole } from '../../hooks/role.hook.js'
import { ApprovalsController } from './approvals.controller.js'

export async function approvalsRoutes(app: FastifyInstance) {
  const approvalsController = new ApprovalsController()

  // A MÁGICA DA AUTORIZAÇÃO ACONTECE AQUI
  app.addHook('preHandler', verifyRole(['GESTOR', 'RH', 'FINANCEIRO']))

  app.post('/:reportId/decision', (req, rep) => approvalsController.create(req, rep))
}
