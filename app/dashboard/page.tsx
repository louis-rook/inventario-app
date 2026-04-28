'use client'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const cards = [
  { href: '/cargar',     icon: '📂', title: 'Cargar Inventario', desc: 'Importa un archivo inv[XX].txt desde tu equipo', color: '#388bfd' },
  { href: '/consulta',   icon: '📋', title: 'Conteo Físico',     desc: 'Registra conteos y observaciones por referencia', color: '#3fb950' },
  { href: '/acumulados', icon: '📊', title: 'Acumulados',        desc: 'Consulta el informe histórico con filtros',       color: '#d29922' },
]

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Bienvenido, {session?.user?.name}</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 14 }}>
          Sistema de control de inventario — Que deseas hacer hoy?
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {cards.map(c => (
          <Link key={c.href} href={c.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{c.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
