import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import knex from '../database'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })

    const { name, email } = createUserBodySchema.parse(request.body)

    const existingUser = await knex('users').where('email', email).first()

    if (existingUser) {
      return reply.status(400).send({
        message: 'User already exists',
      })
    }

    const sessionId = randomUUID()

    reply.setCookie('sessionId', sessionId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.post('/session', async (request, reply) => {
    const createSessionBodySchema = z.object({
      email: z.string().email(),
    })

    const { email } = createSessionBodySchema.parse(request.body)

    const user = await knex('users').where('email', email).first()

    if (user) {
      const sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      await knex('users')
        .update({ session_id: sessionId })
        .where('email', email)
    } else {
      return reply.status(400).send({
        error: 'User does not exist',
      })
    }

    return reply.status(200).send()
  })
}
