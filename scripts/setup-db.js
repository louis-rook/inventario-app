#!/usr/bin/env node
/**
 * Script de configuración inicial de usuarios
 * Uso: DATABASE_URL="..." node scripts/setup-db.js
 */

const { neon } = require('@neondatabase/serverless')
const bcrypt = require('bcryptjs')

const usuarios = [
  { username: 'admin',    nombre: 'Administrador', password: 'Admin2024!' },
  { username: 'usuario1', nombre: 'Usuario 1',     password: 'User1_2024!' },
  { username: 'usuario2', nombre: 'Usuario 2',     password: 'User2_2024!' },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Falta DATABASE_URL en las variables de entorno')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  console.log('🔧 Creando usuarios iniciales...\n')

  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, 10)
    await sql`
      INSERT INTO usuarios (username, password_hash, nombre)
      VALUES (${u.username}, ${hash}, ${u.nombre})
      ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
    `
    console.log(`✅ ${u.username} → contraseña: ${u.password}`)
  }

  console.log('\n🎉 Usuarios creados. ¡Cambia las contraseñas en producción!')
}

main().catch(e => { console.error(e); process.exit(1) })
