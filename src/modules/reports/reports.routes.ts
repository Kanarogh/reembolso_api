<<<<<<< HEAD
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
=======
import { FastifyInstance } from "fastify";

import { authHook } from "../../hooks/auth.hook.js"; // Importa nosso "guarda"
import { verifyRole } from "../../hooks/role.hook.js";
import { ExpensesController } from "../expenses/expenses.controller.js";
import { ReportsController } from "./reports.controller.js";
export async function reportsRoutes(app: FastifyInstance) {
  const reportsController = new ReportsController();
  const expensesController = new ExpensesController();

  // Aplica o hook de autenticação a todas as rotas deste arquivo
  app.addHook("preHandler", authHook);

  app.post("/", (req, rep) => reportsController.create(req, rep));
  app.get("/", (req, rep) => reportsController.list(req, rep));
  app.get("/:id", (req, rep) => reportsController.findById(req, rep));
  app.delete("/:id", (req, rep) => reportsController.delete(req, rep));
  app.post("/:reportId/expenses", (req, rep) =>
    expensesController.create(req, rep)
  );
  app.delete("/:reportId/expenses/:expenseId", (req, rep) =>
    expensesController.delete(req, rep)
  );
  app.post("/:id/submit", (req, rep) => reportsController.submit(req, rep));
  app.patch(
    "/:id/status",
    // CORREÇÃO: Passamos apenas o papel MÍNIMO.
    { preHandler: [verifyRole("RH")] },
    (request, reply) => reportsController.updateStatus(request, reply)
  );
  app.patch("/:reportId/expenses/:expenseId", (req, rep) =>
    expensesController.update(req, rep)
  );
   app.post('/:reportId/expenses/:expenseId/attachments', (req, rep) => expensesController.addAttachment(req, rep));
}
>>>>>>> 9cabe6f (conectouuuu)
