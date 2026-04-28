import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Borrar en cascada (conteos se eliminan por FK ON DELETE CASCADE)
  await sql`DELETE FROM inventario_datos`

  return NextResponse.json({ ok: true, mensaje: 'Historial eliminado correctamente' })
}
