import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Btn, Input } from '../components/UI.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // login | signup

  const handle = async () => {
    setLoading(true); setError('')
    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { error: err } = await fn
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--green)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>🎓</div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'Lora, Georgia, serif', color: 'var(--text)', marginBottom: '4px' }}>Prof. Marcos</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tu tutor de psiquiatría · Residencia Argentina</p>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', gap: '0', marginBottom: '24px', background: 'var(--green-mist)', borderRadius: '8px', padding: '3px' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: mode === m ? 'var(--white)' : 'transparent', color: mode === m ? 'var(--green)' : 'var(--text-muted)', boxShadow: mode === m ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s' }}>
                {m === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nati@mail.com" autoFocus />
            <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>

          {error && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#fde8e8', border: '1px solid #f5c6c6', borderRadius: '7px', fontSize: '12px', color: 'var(--danger)' }}>{error}</div>
          )}

          {mode === 'signup' && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--green-pale)', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '12px', color: 'var(--text-mid)', lineHeight: '1.5' }}>
              Al crear tu cuenta, todo tu progreso, chats y tareas quedarán guardados en la nube y accesibles desde cualquier dispositivo.
            </div>
          )}

          <Btn onClick={handle} disabled={loading || !email || !password} style={{ width: '100%', marginTop: '18px' }} size="lg">
            {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar →' : 'Crear cuenta →'}
          </Btn>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
