import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fechaDesde = searchParams.get('desde')
  const fechaHasta = searchParams.get('hasta')
  const categoria  = searchParams.get('categoria')
  const tipo       = searchParams.get('tipo')

  let rows = await sql`
    SELECT * FROM vista_acumulados
    WHERE
      (${fechaDesde}::date IS NULL OR fecha >= ${fechaDesde}::date)
      AND (${fechaHasta}::date IS NULL OR fecha <= ${fechaHasta}::date)
      AND (${categoria} IS NULL OR ${categoria} = 'todas' OR categoria ILIKE ${`%${categoria}%`})
      AND (${tipo} IS NULL OR ${tipo} = 'todos' OR tipo ILIKE ${`%${tipo}%`})
    ORDER BY fecha DESC, referencia
  `

  // Resumen totales
  const totales = {
    costo_bodega:    rows.reduce((s: number, r: any) => s + Number(r.costo_bodega_total ?? 0), 0),
    costo_diferencia: rows.reduce((s: number, r: any) => s + Number(r.costo_diferencia ?? 0), 0),
  }

  return NextResponse.json({ rows, totales })
}
