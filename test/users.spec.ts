import Request from 'supertest'
import { execSync } from 'node:child_process'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

import { app } from '../src/app'

describe('Users routes', () => {
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

  it('should be able to create user', async () => {
    const createUserResponse = await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const cookie = createUserResponse.headers['set-cookie']

    expect(cookie).not.toBeUndefined()
  })

  it('should not be able to create user with an existing email', async () => {
    await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const existingEmail = await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(400)

    expect(existingEmail.body.message).toBe('User already exists')
  })

  it('should be able to create session', async () => {
    await Request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(201)

    const createSession = await Request(app.server)
      .post('/users/session')
      .send({
        email: 'john.doe@example.com',
      })
      .expect(200)

    const cookie = createSession.headers['set-cookie']

    expect(cookie).not.toBeUndefined()
  })

  it('should not be able to create session with an invalid email', async () => {
    await Request(app.server)
      .post('/users/session')
      .send({
        email: 'john.doe@example.com',
      })
      .expect(400)
  })
})
