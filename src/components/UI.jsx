import { useState, useEffect } from 'react'

const PRESETS = [
  { name: 'Verde bosque', accent: '#2d6a4f', light: '#40916c', pale: '#d8f3dc', mist: '#f0faf2' },
  { name: 'Verde azulado', accent: '#1b6ca8', light: '#2980b9', pale: '#d6eaf8', mist: '#eaf4fb' },
  { name: 'Violeta', accent: '#6c3483', light: '#8e44ad', pale: '#e8daef', mist: '#f5eef8' },
  { name: 'Terracota', accent: '#922b21', light: '#c0392b', pale: '#fadbd8', mist: '#fdf2f0' },
  { name: 'Pizarra', accent: '#2c3e50', light: '#34495e', pale: '#d5d8dc', mist: '#f2f3f4' },
  { name: 'Teal', accent: '#0e7490', light: '#0891b2', pale: '#cffafe', mist: '#ecfeff' },
]

export function useTheme() {
  const apply = (p) => {
    const r = document.documentElement.style
    r.setProperty('--accent', p.accent)
    r.setProperty('--accent-light', p.light)
    r.setProperty('--accent-pale', p.pale)
    r.setProperty('--accent-mist', p.mist)
  }
  useEffect(() => {
    try { const s = localStorage.getItem('pm_theme'); if (s) apply(JSON.parse(s)) } catch {}
  }, [])
  const setTheme = (p) => { apply(p); localStorage.setItem('pm_theme', JSON.stringify(p)) }
  return { setTheme, presets: PRESETS }
}

export function ThemePicker() {
  const { setTheme, presets } = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '7px 9px', borderRadius: '10px', lineHeight: 1, color: '#fff' }} title="Cambiar color">🎨</button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: '42px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px', boxShadow: 'var(--shadow-lg)', zIndex: 200, width: '200px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>COLOR</div>
            {presets.map(p => (
              <button key={p.name} onClick={() => { setTheme(p); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: p.accent }} />
                <span style={{ fontSize: '13px', color: 'var(--text-mid)' }}>{p.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function Btn({ children, variant = 'primary', size = 'md', disabled, onClick, style = {}, type = 'button', full }) {
  const sz = { sm: { p: '6px 14px', f: '12px' }, md: { p: '10px 20px', f: '13px' }, lg: { p: '13px 28px', f: '14px' } }[size]
  const v = {
    primary:   { bg: 'var(--accent)', color: '#fff', border: 'none' },
    secondary: { bg: 'var(--accent-pale)', color: 'var(--accent)', border: 'none' },
    ghost:     { bg: 'transparent', color: 'var(--text-mid)', border: '1px solid var(--border)' },
    danger:    { bg: '#fde8e8', color: 'var(--danger)', border: '1px solid #f5c6c6' },
    white:     { bg: '#fff', color: 'var(--accent)', border: '1px solid var(--border)' },
  }[variant] || {}
  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: sz.p, fontSize: sz.f, fontWeight: '600', borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, border: v.border, background: v.bg, color: v.color, transition: 'all 0.15s', whiteSpace: 'nowrap', width: full ? '100%' : undefined, ...style }}>
      {children}
    </button>
  )
}

export function Card({ children, style = {}, onClick, padding = '16px' }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding, transition: 'all 0.15s', cursor: onClick ? 'pointer' : 'default', ...style }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-1px)' } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none' } : undefined}>
      {children}
    </div>
  )
}

export function Badge({ children, color }) {
  const c = color || 'var(--accent)'
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: c + '18', color: c, whiteSpace: 'nowrap' }}>{children}</span>
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-mid)' }}>{label}</label>}
      <input {...props} style={{ padding: '11px 14px', border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--text)', background: '#fff', outline: 'none', width: '100%', transition: 'border-color 0.15s', ...props.style }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'} />
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

export function Spinner({ size = 24 }) {
  return <div style={{ width: size, height: size, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
}

export function PageLoader() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}><Spinner size={32} /></div>
}

export function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '8px' }}>{title}</div>
      {sub && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>{sub}</div>}
      {action}
    </div>
  )
}

export function Avatar({ emoji = '🎓', size = 36, bg }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: bg || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.44 }}>{emoji}</div>
}
