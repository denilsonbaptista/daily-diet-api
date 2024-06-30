import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import knex from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
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

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        date,
        is_on_diet: isOnDiet,
        user_id: user?.id,
      })

      return reply.status(201).send()
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        isOnDiet: z.boolean(),
      })

      const { id } = updateMealParamsSchema.parse(request.params)
      const { name, description, date, isOnDiet } = updateMealBodySchema.parse(
        request.body,
      )

      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()
      const meal = await knex('meals').where('id', id).first()

      const checkMeal = meal?.user_id !== user?.id

      if (checkMeal) {
        return reply.status(401).send({
          error: 'Invalid meal',
        })
      }

      await knex('meals').where('id', id).update({
        name,
        description,
        date,
        is_on_diet: isOnDiet,
        updated_at: knex.fn.now(),
      })

      return reply.status(200).send()
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const deleteMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = deleteMealParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()
      const meal = await knex('meals').where('id', id).first()

      const checkMeal = meal?.user_id !== user?.id

      if (checkMeal) {
        return reply.status(401).send({
          error: 'Invalid meal',
        })
      }

      await knex('meals').where('id', id).delete()

      return reply.status(200).send({ message: 'Meal deleted' })
    },
  )

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()
      const meals = await knex('meals')
        .where('user_id', user?.id)
        .orderBy('date', 'desc')

      return reply.status(200).send({
        meals,
      })
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()
      const meal = await knex('meals')
        .where('id', id)
        .andWhere('user_id', user?.id)
        .first()

      if (!meal) {
        return reply.status(404).send({
          error: 'Meal not found',
        })
      }

      return reply.status(200).send({
        meal,
      })
    },
  )

  app.get(
    '/metrics',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()

      const registeredMeals = await knex('meals').where('user_id', user?.id)
      const mealsWithinTheDiet = await knex('meals')
        .where('user_id', user?.id)
        .andWhere('is_on_diet', true)
      const mealsOutOfDiet = await knex('meals')
        .where('user_id', user?.id)
        .andWhere('is_on_diet', false)

      const totalRegisteredMeals = registeredMeals.length
      const totalMealsWithinTheDiet = mealsWithinTheDiet.length
      const totalMealsOutOfDiet = mealsOutOfDiet.length

      const bestSequence = registeredMeals.reduce(
        (acc, meal) => {
          let { currentSequence } = acc // Destructuring assignment
          currentSequence = meal.is_on_diet ? currentSequence + 1 : 0

          if (currentSequence > acc.bestSequence) {
            acc.bestSequence = currentSequence
          }

          return {
            bestSequence: acc.bestSequence,
            currentSequence,
          }
        },
        {
          bestSequence: 0,
          currentSequence: 0,
        },
      )

      const percentageMealsWithinTheDiet = (
        (totalMealsWithinTheDiet / totalRegisteredMeals) *
        100
      ).toFixed(2)

      return reply.status(200).send({
        'registered meals': totalRegisteredMeals,
        'meals within the diet': totalMealsWithinTheDiet,
        'meals out of diet': totalMealsOutOfDiet,
        'best sequence': bestSequence,
        'percentage of meals within the diet': `${percentageMealsWithinTheDiet}%`,
      })
    },
  )
}
