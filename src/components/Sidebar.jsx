import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ThemePicker } from './UI.jsx'

const NAV = [
  { path: '/',         icon: '⌂',  label: 'Inicio' },
  { path: '/marcos',   icon: '💬', label: 'Chat libre' },
  { path: '/programa', icon: '📚', label: 'Programa' },
  { path: '/mis-pdfs', icon: '📄', label: 'Mis PDFs' },
  { path: '/tareas',   icon: '✍️', label: 'Tareas' },
  { path: '/buscar',   icon: '🔍', label: 'Buscar' },
]

export function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()
  if (loc.pathname.startsWith('/chat/') || loc.pathname === '/marcos') return null
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 'var(--nav-h)', background: '#fff', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'stretch', zIndex: 100, boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
      {NAV.map(item => {
        const active = loc.pathname === item.path || (item.path !== '/' && item.path !== '/marcos' && loc.pathname.startsWith(item.path))
        const isActive = active || loc.pathname === item.path
        return (
          <button key={item.path} onClick={() => nav(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', border: 'none', background: 'none', cursor: 'pointer', color: isActive ? 'var(--accent)' : 'var(--text-faint)', transition: 'color 0.15s', position: 'relative' }}>
            <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: '9px', fontWeight: isActive ? '700' : '500' }}>{item.label}</span>
            {isActive && <div style={{ position: 'absolute', bottom: 0, width: '28px', height: '2px', background: 'var(--accent)', borderRadius: '2px 2px 0 0' }} />}
          </button>
        )
      })}
    </nav>
  )
}

export default function Sidebar() {
  const nav = useNavigate()
  const loc = useLocation()
  const handleLogout = async () => { await supabase.auth.signOut(); nav('/login') }

  return (
    <aside style={{ width: '220px', flexShrink: 0, background: 'var(--accent)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '22px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', fontWeight: '600', marginBottom: '2px' }}>TUTOR</div>
            <div style={{ fontSize: '19px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>Prof. Marcos</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '1px' }}>Psiquiatría · Residencia</div>
          </div>
          <ThemePicker />
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(item => {
          const active = loc.pathname === item.path || (item.path !== '/' && item.path !== '/marcos' && loc.pathname.startsWith(item.path)) || loc.pathname === item.path
          return (
            <button key={item.path} onClick={() => nav(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: active ? 'rgba(255,255,255,0.18)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: active ? '700' : '400', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
              {item.path === '/marcos' && <span style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#86efac', flexShrink: 0 }} />}
            </button>
          )
        })}
      </nav>
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          ↪ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
