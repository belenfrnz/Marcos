// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', disabled, onClick, style = {}, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    border: 'none', borderRadius: '8px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
  }
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '9px 18px', fontSize: '13px' },
    lg: { padding: '12px 24px', fontSize: '14px' },
  }
  const variants = {
    primary:   { background: 'var(--green)', color: '#fff' },
    secondary: { background: 'var(--green-pale)', color: 'var(--green)' },
    ghost:     { background: 'transparent', color: 'var(--text-mid)', border: '1px solid var(--border)' },
    danger:    { background: '#fde8e8', color: 'var(--danger)', border: '1px solid #f5c6c6' },
  }
  return (
    <button type={type} onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow 0.15s',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
    onMouseEnter={onClick ? e => e.currentTarget.style.boxShadow = 'var(--shadow-md)' : undefined}
    onMouseLeave={onClick ? e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)' : undefined}
    >
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'var(--green)' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
      background: color + '18', border: `1px solid ${color}33`,
      color, fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)' }}>{label}</label>}
      <input {...props} style={{
        padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px',
        fontSize: '14px', color: 'var(--text)', background: 'var(--white)', outline: 'none',
        transition: 'border-color 0.15s', width: '100%',
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--green)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>{title}</div>
      {sub && <div style={{ fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>{sub}</div>}
      {action}
    </div>
  )
}
