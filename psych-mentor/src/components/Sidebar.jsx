import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const NAV = [
  { path: '/',           icon: '⌂',  label: 'Inicio' },
  { path: '/programa',   icon: '📚', label: 'Programa' },
  { path: '/mis-pdfs',   icon: '📄', label: 'Mis PDFs' },
  { path: '/tareas',     icon: '✍️', label: 'Tareas' },
  { path: '/buscar',     icon: '🔍', label: 'Buscar' },
]

export default function Sidebar() {
  const nav = useNavigate()
  const loc = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    nav('/login')
  }

  return (
    <aside style={{
      width: '220px', flexShrink: 0,
      background: 'var(--green)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '2px', fontWeight: '600', marginBottom: '4px' }}>TUTOR</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', fontFamily: 'Lora, Georgia, serif' }}>Prof. Marcos</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Psiquiatría · Residencia</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(item => {
          const active = loc.pathname === item.path || (item.path !== '/' && loc.pathname.startsWith(item.path))
          return (
            <button key={item.path} onClick={() => nav(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', border: 'none',
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                fontSize: '13px', fontWeight: active ? '600' : '400',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span>↪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
