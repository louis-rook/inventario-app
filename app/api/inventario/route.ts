import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

// ── Helpers ──────────────────────────────────────────────────────────────────

function limpiarNum(val: string): number {
  const s = val.replace(/\$|,/g, '').trim()
  return isNaN(Number(s)) ? 0 : Number(s)
}

function mapearColumnas(headers: string[]) {
  const map: Record<string, number> = {}
  headers.forEach((h, i) => {
    // Limpia BOM y espacios por si acaso
    const k = h.replace(/^\uFEFF/, '').toLowerCase().trim()
    if (k === 'referencia')                                        map.referencia   = i
    if (['desc. item', 'desc item', 'descripcion'].includes(k))   map.descripcion  = i
    if (['bodega', 'localizacion'].includes(k))                    map.localizacion = i
    if (k === 'categoria')                                         map.categoria    = i
    if (['sub-grupo', 'subgrupo', 'tipo'].includes(k))             map.tipo         = i
    if (['existencia', 'cantidad'].includes(k))                    map.cantidad     = i
    if (['u.m.', 'u.m', 'um'].includes(k))                        map.um           = i
    if (k.includes('costo prom. uni') || k.includes('costo unitario')) map.costo_unitario = i
    if (k.includes('costo prom. total') || k.includes('costo total'))  map.costo_total    = i
  })
  return map
}

// ── GET: lista de registros ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fecha     = searchParams.get('fecha')
  const categoria = searchParams.get('categoria')

  let rows
  if (fecha && categoria && categoria !== 'todas') {
    rows = await sql`SELECT * FROM vista_consulta WHERE fecha = ${fecha} AND categoria = ${categoria} ORDER BY referencia`
  } else if (fecha) {
    rows = await sql`SELECT * FROM vista_consulta WHERE fecha = ${fecha} ORDER BY referencia`
  } else {
    rows = await sql`SELECT DISTINCT fecha FROM inventario_datos ORDER BY fecha DESC LIMIT 30`
  }

  return NextResponse.json(rows)
}

// ── POST: cargar TXT ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file     = formData.get('file') as File
  const dia      = formData.get('dia')  as string

  if (!file || !dia) {
    return NextResponse.json({ error: 'Falta el archivo o el día' }, { status: 400 })
  }

  // Calcular fecha: día del nombre + mes y año actuales
  const hoy    = new Date()
  const diaNum = parseInt(dia, 10)
  if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
    return NextResponse.json({ error: 'Día inválido' }, { status: 400 })
  }
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), diaNum)
  const fechaStr = fecha.toISOString().split('T')[0] // YYYY-MM-DD

  
  // Leer y eliminar BOM si existe
let text = await file.text()
text = text.replace(/^\uFEFF/, '')

const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')

  if (lines.length < 2) {
    return NextResponse.json({ error: 'El archivo está vacío o no tiene datos' }, { status: 400 })
  }

  const headers = lines[0].split('\t')
  const cols    = mapearColumnas(headers)

  if (cols.referencia === undefined) {
    return NextResponse.json({ error: 'No se encontró la columna Referencia en el TXT' }, { status: 400 })
  }

  const userId = session.user?.id ?? null

  // Eliminar registros previos de esa fecha para evitar duplicados
  await sql`DELETE FROM inventario_datos WHERE fecha = ${fechaStr}`

  let insertados = 0
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split('\t')
    if (!fields[cols.referencia]?.trim()) continue

    await sql`
      INSERT INTO inventario_datos
        (fecha, categoria, referencia, descripcion, localizacion,
         cantidad, um, costo_unitario, costo_total, tipo, cargado_por)
      VALUES (
        ${fechaStr},
        ${fields[cols.categoria]?.trim() ?? ''},
        ${fields[cols.referencia].trim()},
        ${fields[cols.descripcion]?.trim() ?? ''},
        ${fields[cols.localizacion]?.trim() ?? ''},
        ${limpiarNum(fields[cols.cantidad] ?? '0')},
        ${fields[cols.um]?.trim() ?? ''},
        ${limpiarNum(fields[cols.costo_unitario] ?? '0')},
        ${limpiarNum(fields[cols.costo_total] ?? '0')},
        ${fields[cols.tipo]?.trim() ?? ''},
        ${userId}
      )
    `
    insertados++
  }

  return NextResponse.json({ ok: true, insertados, fecha: fechaStr })
}
