import { FastifyInstance } from 'fastify'

import { authHook } from '../../hooks/auth.hook.js' // Importa nosso "guarda"
import { ReportsController } from './reports.controller.js'
import { ExpensesController } from '../expenses/expenses.controller.js'

export async function reportsRoutes(app: FastifyInstance) {
  const reportsController = new ReportsController()
  const expensesController = new ExpensesController()

  // Aplica o hook de autenticação a todas as rotas deste arquivo
  app.addHook('preHandler', authHook)

  app.post('/', (req, rep) => reportsController.create(req, rep))
  app.get('/', (req, rep) => reportsController.list(req, rep))
  app.get('/:id', (req, rep) => reportsController.findById(req, rep))
  app.delete('/:id', (req, rep) => reportsController.delete(req, rep))
  app.post('/:reportId/expenses', (req, rep) => expensesController.create(req, rep))
  app.delete('/:reportId/expenses/:expenseId', (req, rep) => expensesController.delete(req, rep))
  
}