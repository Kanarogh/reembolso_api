// src/modules/users/users.routes.ts
import { FastifyInstance } from 'fastify'
import { verifyRole } from '../../hooks/role.hook.js'
import { UsersController } from './users.controller.js'

export async function usersRoutes(app: FastifyInstance) {
  const usersController = new UsersController()

 app.addHook('preHandler', verifyRole('GESTOR'))

  app.get('/', (req, rep) => usersController.list(req, rep))
  app.post('/', (req, rep) => usersController.create(req, rep))
   app.patch('/:id', (req, rep) => usersController.update(req, rep))
   app.delete('/:id', (req, rep) => usersController.delete(req, rep))
}
