// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      session_id: string
      name: string
      email: string
      created_at: Date
    }
    meals: {
      id: string
      user_id: string
      name: string
      description: string
      date: Date
      is_on_diet: boolean
      created_at: Date
      updated_at: Date
    }
  }
}
