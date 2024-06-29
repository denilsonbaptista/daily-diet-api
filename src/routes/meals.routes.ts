import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import knex from '../database'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      isOnDiet: z.boolean(),
    })

    const { name, description, date, isOnDiet } = createMealBodySchema.parse(
      request.body,
    )

    const { sessionId } = request.cookies

    const user = await knex('users').where('session_id', sessionId).first()

    if (!user) {
      return reply.status(401).send({
        message: 'Invalid or expired session',
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      date,
      is_on_diet: isOnDiet,
      user_id: user?.id,
    })

    return reply.status(201).send()
  })
}
