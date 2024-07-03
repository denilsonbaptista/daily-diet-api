import Request from 'supertest'
import { execSync } from 'node:child_process'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

import { app } from '../src/app'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a meal', async () => {
    const createUserResponse = await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.headers['set-cookie']

    const createMealResponse = await Request(app.server)
      .post('/meals')
      .send({
        name: 'Meal 1',
        description: 'Description 1',
        date: '2024-01-01 01:40:32',
        isOnDiet: true,
      })
      .set('Cookie', cookie)

    expect(createMealResponse.statusCode).toEqual(201)
  })

  it('should be able to update a meal', async () => {
    const createUserResponse = await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.headers['set-cookie']

    await Request(app.server)
      .post('/meals')
      .send({
        name: 'Meal 1',
        description: 'Description 1',
        date: '2024-01-01 01:40:32',
        isOnDiet: true,
      })
      .set('Cookie', cookie)
      .expect(201)

    const listMealsResponse = await Request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await Request(app.server)
      .put(`/meals/${mealId}`)
      .send({
        name: 'Meal 2',
        description: 'Description 2',
        date: '2024-01-01 01:40:32',
        isOnDiet: false,
      })
      .set('Cookie', cookie)
      .expect(200)
  })

  it('should be able to delete a meal', async () => {
    const createUserResponse = await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.headers['set-cookie']

    await Request(app.server)
      .post('/meals')
      .send({
        name: 'Meal 1',
        description: 'Description 1',
        date: '2024-01-01 01:40:32',
        isOnDiet: true,
      })
      .set('Cookie', cookie)
      .expect(201)

    const listMealsResponse = await Request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const deleteMealResponse = await Request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookie)
      .expect(200)

    expect(deleteMealResponse.body.message).toBe('Meal deleted')
  })

  it('should be able to list all meals from a user', async () => {
    const createUserResponse = await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.headers['set-cookie']

    await Request(app.server)
      .post('/meals')
      .send({
        name: 'Meal 1',
        description: 'Description 1',
        date: '2024-01-01 01:40:32',
        isOnDiet: true,
      })
      .set('Cookie', cookie)
      .expect(201)

    const listMealsResponse = await Request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Meal 1',
        description: 'Description 1',
        date: 1704084032000,
        is_on_diet: 1,
      }),
    ])
  })

  it('should be able to view a single meal from a user', async () => {
    const createUserResponse = await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.headers['set-cookie']

    await Request(app.server)
      .post('/meals')
      .send({
        name: 'Meal 1',
        description: 'Description 1',
        date: '2024-01-01 01:40:32',
        isOnDiet: true,
      })
      .set('Cookie', cookie)
      .expect(201)

    const listMealsResponse = await Request(app.server)
      .get('/meals')
      .set('Cookie', cookie)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const viewMealResponse = await Request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookie)
      .expect(200)

    expect(viewMealResponse.body).toEqual(
      expect.objectContaining({
        name: 'Meal 1',
        description: 'Description 1',
        date: 1704084032000,
        is_on_diet: 1,
      }),
    )
  })

  it('should be able to get the ', async () => {
    const createUserResponse = await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.headers['set-cookie']

    for (let i = 0; i < 10; i++) {
      await Request(app.server)
        .post('/meals')
        .send({
          name: `Meal ${i + 1}`,
          description: `Description ${i + 1}`,
          date: '2024-01-01 01:40:32',
          isOnDiet: true,
        })
        .set('Cookie', cookie)
        .expect(201)
    }

    const metricsResponse = await Request(app.server)
      .get(`/meals/metrics`)
      .set('Cookie', cookie)
      .expect(200)

    expect(metricsResponse.body).toEqual({
      'registered meals': 10,
      'meals within the diet': 10,
      'meals out of diet': 0,
      'best sequence': { bestSequence: 10, currentSequence: 10 },
      'percentage of meals within the diet': '100.00%',
    })
  })
})
