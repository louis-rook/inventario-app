import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const desde    = searchParams.get('desde')    || null
  const hasta    = searchParams.get('hasta')    || null
  const categoria = searchParams.get('categoria') || null
  const tipo     = searchParams.get('tipo')     || null

  // Construir query dinámicamente según los filtros presentes
  let rows: any[]

  if (desde && hasta && categoria && tipo) {
    rows = await sql`SELECT * FROM vista_acumulados WHERE fecha BETWEEN ${desde} AND ${hasta} AND categoria ILIKE ${`%${categoria}%`} AND tipo ILIKE ${`%${tipo}%`} ORDER BY fecha DESC, referencia`
  } else if (desde && hasta && categoria) {
    rows = await sql`SELECT * FROM vista_acumulados WHERE fecha BETWEEN ${desde} AND ${hasta} AND categoria ILIKE ${`%${categoria}%`} ORDER BY fecha DESC, referencia`
  } else if (desde && hasta && tipo) {
    rows = await sql`SELECT * FROM vista_acumulados WHERE fecha BETWEEN ${desde} AND ${hasta} AND tipo ILIKE ${`%${tipo}%`} ORDER BY fecha DESC, referencia`
  } else if (desde && hasta) {
    rows = await sql`SELECT * FROM vista_acumulados WHERE fecha BETWEEN ${desde} AND ${hasta} ORDER BY fecha DESC, referencia`
  } else {
    rows = await sql`SELECT * FROM vista_acumulados ORDER BY fecha DESC, referencia`
  }

  const totales = {
    costo_bodega:     rows.reduce((s, r) => s + Number(r.costo_bodega_total  ?? 0), 0),
    costo_diferencia: rows.reduce((s, r) => s + Number(r.costo_diferencia    ?? 0), 0),
  }

  return NextResponse.json({ rows, totales })
}