import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Btn, Input, useTheme } from '../components/UI.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')
  useTheme()

  const handle = async () => {
    setLoading(true); setError('')
    const { error: err } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, var(--accent) 0%, var(--accent-light) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(255,255,255,0.2)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>🎓</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '4px', letterSpacing: '-0.5px' }}>Prof. Marcos</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Tu tutor de psiquiatría · Residencia Argentina</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '10px', padding: '3px', marginBottom: '24px' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: mode === m ? '#fff' : 'transparent', color: mode === m ? 'var(--accent)' : 'var(--text-muted)', boxShadow: mode === m ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s' }}>
                {m === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nati@mail.com" autoFocus />
            <Input label="Contraseña" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>

          {error && <div style={{ marginTop: '12px', padding: '10px 12px', background: '#fde8e8', borderRadius: '8px', fontSize: '12px', color: 'var(--danger)' }}>{error}</div>}

          {mode === 'signup' && <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', padding: '10px 12px', background: 'var(--accent-mist)', borderRadius: '8px' }}>Tu progreso, chats y tareas quedan guardados en la nube y accesibles desde cualquier dispositivo.</p>}

          <Btn onClick={handle} disabled={loading || !email || !pw} full style={{ marginTop: '20px', padding: '13px', fontSize: '14px', borderRadius: '10px' }}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar →' : 'Crear cuenta →'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
