import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Card, Badge, Btn, PageLoader, useTheme } from '../components/UI.jsx'

function daysLeft(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000) }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches' }

export default function Dashboard() {
  const user = useAuth()
  const nav = useNavigate()
  const [tasks, setTasks] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  useTheme()

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending').order('due_date', { ascending: true }).limit(6),
      supabase.from('documents').select('id,title,mentor_role,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(4),
    ]).then(([t, d]) => { setTasks(t.data || []); setDocs(d.data || []); setLoading(false) })
  }, [user])

  if (loading) return <PageLoader />

  const overdue = tasks.filter(t => { const d = daysLeft(t.due_date); return d !== null && d < 0 })
  const urgent = tasks.filter(t => { const d = daysLeft(t.due_date); return d !== null && d >= 0 && d <= 2 })

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="has-bottom-nav">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>{greeting()}, Nati</p>
        <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text)', lineHeight: 1.2, marginTop: '2px' }}>¿Con qué<br />trabajamos hoy?</h1>
      </div>

      {/* Alerts */}
      {(overdue.length > 0 || urgent.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {overdue.map(t => (
            <div key={t.id} onClick={() => nav('/tareas')} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: '#fde8e8', border: '1px solid #f5c6c6', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)' }}>Tarea vencida: {t.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--danger)', opacity: 0.7 }}>Hace {Math.abs(daysLeft(t.due_date))} día{Math.abs(daysLeft(t.due_date)) > 1 ? 's' : ''}</div>
              </div>
              <span style={{ color: 'var(--danger)', fontSize: '14px' }}>→</span>
            </div>
          ))}
          {urgent.map(t => (
            <div key={t.id} onClick={() => nav('/tareas')} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
              <span style={{ fontSize: '20px' }}>🔥</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--warn)' }}>{t.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--warn)', opacity: 0.8 }}>{daysLeft(t.due_date) === 0 ? 'Vence hoy' : `${daysLeft(t.due_date)}d restantes`}</div>
              </div>
              <span style={{ color: 'var(--warn)', fontSize: '14px' }}>→</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <Card onClick={() => nav('/mis-pdfs')} style={{ background: 'var(--accent)', border: 'none' }} padding="18px">
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Subir PDF</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>Nueva sesión</div>
        </Card>
        <Card onClick={() => nav('/programa')} padding="18px">
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Programa</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Bibliografía guiada</div>
        </Card>
      </div>

      {/* Pending tasks */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Tareas pendientes</h2>
            <Btn variant="ghost" size="sm" onClick={() => nav('/tareas')}>Ver todas</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.slice(0, 3).map(t => {
              const d = daysLeft(t.due_date)
              const hot = d !== null && d <= 2
              return (
                <Card key={t.id} onClick={() => nav('/tareas')} padding="12px 14px">
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px' }}>{hot ? '🔥' : '📝'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      {t.due_date && <div style={{ fontSize: '11px', color: hot ? 'var(--warn)' : 'var(--text-faint)', marginTop: '1px', fontWeight: hot ? '600' : '400' }}>
                        {d < 0 ? `Venció hace ${Math.abs(d)}d` : d === 0 ? '⏰ Vence hoy' : `${d}d restantes`}
                      </div>}
                    </div>
                    <span style={{ color: 'var(--text-faint)' }}>›</span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {docs.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Sesiones recientes</h2>
            <Btn variant="ghost" size="sm" onClick={() => nav('/mis-pdfs')}>Ver todo</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {docs.map(d => (
              <Card key={d.id} onClick={() => nav(`/chat/${d.id}`)} padding="12px 14px">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px' }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '1px' }}>{new Date(d.updated_at).toLocaleDateString('es-AR')}</div>
                  </div>
                  <span style={{ color: 'var(--text-faint)' }}>›</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {docs.length === 0 && tasks.length === 0 && (
        <Card padding="24px" style={{ textAlign: 'center', border: '2px dashed var(--border)', background: 'var(--accent-mist)', boxShadow: 'none' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>👋</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>¡Bienvenida, Nati!</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>Subí tu primer PDF y empezá una sesión con el Prof. Marcos.</p>
          <Btn onClick={() => nav('/mis-pdfs')}>Subir primer PDF →</Btn>
        </Card>
      )}
    </div>
  )
}
