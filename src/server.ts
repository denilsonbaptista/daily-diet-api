import fastify from 'fastify'
import knex from './database'

const app = fastify()

app.get('/', async () => {
  const table = await knex('sqlite_schema').select('*')

  return { table, message: 'Hello World!' }
})

app
  .listen({
    host: '127.0.0.1',
    port: 3333,
  })
  .then(() => {
    console.log('HTTP Server running')
  })
