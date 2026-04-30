'use client'
import { useState } from 'react'

type Row = {
  fecha: string; categoria: string; tipo: string; referencia: string
  descripcion: string; localizacion: string; um: string
  cantidad_sistema: number; costo_unitario: number
  conteo_fisico: number; diferencia: number
  costo_diferencia: number; costo_bodega_total: number; observaciones: string
}

type Totales = { costo_bodega: number; costo_diferencia: number }

function fmt(n: number, prefix = '$') {
  if (n === null || n === undefined || isNaN(n)) return '—'
  const s = Math.abs(n).toLocaleString('es-CO', { minimumFractionDigits: 0 })
  return (n < 0 ? `-${prefix}` : prefix) + s
}

export default function AcumuladosPage() {
  const [desde,     setDesde]    = useState('')
  const [hasta,     setHasta]    = useState('')
  const [categoria, setCat]      = useState('')
  const [tipo,      setTipo]     = useState('')
  const [rows,      setRows]     = useState<Row[]>([])
  const [totales,   setTotales]  = useState<Totales | null>(null)
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState('')
  const [reiniciando, setRein]   = useState(false)
  const [confirm,   setConfirm]  = useState(0)

  async function buscar() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      if (categoria) params.set('categoria', categoria)
      if (tipo)      params.set('tipo', tipo)

      const res  = await fetch(`/api/acumulados?${params}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
        setRows([])
        setTotales(null)
      } else {
        setRows(data.rows ?? [])
        setTotales(data.totales ?? null)
      }
    } catch (e: any) {
      setError('No se pudo conectar con el servidor: ' + e.message)
      setRows([])
      setTotales(null)
    } finally {
      setLoading(false)
    }
  }

  async function reiniciar() {
    if (confirm < 1) { setConfirm(1); return }
    setRein(true)
    try {
      await fetch('/api/reiniciar', { method: 'DELETE' })
      setRows([]); setTotales(null); setConfirm(0)
      alert('Historial eliminado correctamente.')
    } catch {
      alert('Error al reiniciar.')
    }
    setRein(false)
  }

  const participacion = totales && totales.costo_bodega !== 0
    ? ((totales.costo_diferencia / totales.costo_bodega) * 100).toFixed(1) + '%'
    : '—'

  return (
    <div style={{ padding: '24px 32px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>?? Informe Acumulados</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>Historial consolidado de todos los conteos</p>
        </div>
        <button onClick={reiniciar} disabled={reiniciando} className="btn btn-danger" style={{ fontSize: 12 }}>
          {confirm === 1 ? '?? Confirmar borrado total' : '??? Reiniciar historial'}
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            style={{ padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            style={{ padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</label>
          <input type="text" value={categoria} onChange={e => setCat(e.target.value)} placeholder="todas"
            style={{ padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', width: 160 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</label>
          <input type="text" value={tipo} onChange={e => setTipo(e.target.value)} placeholder="todos"
            style={{ padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', width: 130 }} />
        </div>
        <button onClick={buscar} className="btn btn-primary" disabled={loading}>
          {loading ? '? Buscando...' : '?? Buscar'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 6,
          background: 'rgba(248,81,73,0.1)', border: '1px solid var(--danger)',
          color: 'var(--danger)', fontSize: 13
        }}>
          ? {error}
        </div>
      )}

      {/* Totales */}
      {totales && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div className="stat-card"><div className="stat-label">Registros</div><div className="stat-value">{rows.length}</div></div>
          <div className="stat-card"><div className="stat-label">Costo Bodega</div><div className="stat-value" style={{ fontSize: 15 }}>{fmt(totales.costo_bodega)}</div></div>
          <div className="stat-card">
            <div className="stat-label">Costo Diferencia</div>
            <div className="stat-value" style={{ fontSize: 15, color: totales.costo_diferencia < 0 ? 'var(--danger)' : 'var(--accent)' }}>
              {fmt(totales.costo_diferencia)}
            </div>
          </div>
          <div className="stat-card"><div className="stat-label">Participación</div><div className="stat-value" style={{ color: 'var(--warn)' }}>{participacion}</div></div>
        </div>
      )}

      {/* Tabla */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>? Buscando datos...</div>
        ) : rows.length === 0 && !error ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
            Usa los filtros y presiona <strong>Buscar</strong> para ver los datos.
          </div>
        ) : (
          <table className="inv-table">
            <thead>
              <tr>
                <th>Fecha</th><th>Referencia</th><th>Descripción</th>
                <th>Loc.</th><th>U.M</th><th>Categoría</th><th>Tipo</th>
                <th>Cant. Sistema</th><th>Conteo Físico</th><th>Diferencia</th>
                <th>Costo Unit.</th><th>Costo Dif.</th><th>Costo Bodega</th><th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-CO')}</td>
                  <td><span className="mono" style={{ fontSize: 12 }}>{r.referencia}</span></td>
                  <td style={{ maxWidth: 200 }}>{r.descripcion}</td>
                  <td>{r.localizacion}</td><td>{r.um}</td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{r.categoria}</td>
                  <td>{r.tipo}</td>
                  <td style={{ textAlign: 'right' }}>{Number(r.cantidad_sistema).toLocaleString('es-CO')}</td>
                  <td style={{ textAlign: 'right' }}>{r.conteo_fisico > 0 ? Number(r.conteo_fisico).toLocaleString('es-CO') : '—'}</td>
                  <td style={{ textAlign: 'right' }} className={Number(r.diferencia) < 0 ? 'neg' : Number(r.diferencia) > 0 ? 'pos' : ''}>
                    {Number(r.diferencia) !== 0 ? Number(r.diferencia).toLocaleString('es-CO') : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>{fmt(r.costo_unitario)}</td>
                  <td style={{ textAlign: 'right' }} className={Number(r.costo_diferencia) < 0 ? 'neg' : ''}>{fmt(r.costo_diferencia)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(r.costo_bodega_total)}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{r.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}