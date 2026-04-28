import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno')
}

// Conexión singleton a Neon
export const sql = neon(process.env.DATABASE_URL)
