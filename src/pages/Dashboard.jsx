import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Card, Badge, Btn, Spinner } from '../components/UI.jsx'

function greetingByTime() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function daysLeft(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

export default function Dashboard() {
  const user = useAuth()
  const nav = useNavigate()
  const [tasks, setTasks] = useState([])
  const [recentDocs, setRecentDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending').order('due_date', { ascending: true }).limit(5),
      supabase.from('documents').select('id,title,mentor_role,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(4),
    ]).then(([t, d]) => {
      setTasks(t.data || [])
      setRecentDocs(d.data || [])
      setLoading(false)
    })
  }, [user])

  const pendingOverdue = tasks.filter(t => daysLeft(t.due_date) !== null && daysLeft(t.due_date) < 0)
  const pendingUrgent = tasks.filter(t => { const d = daysLeft(t.due_date); return d !== null && d >= 0 && d <= 2 })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={32} /></div>

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>
          {greetingByTime()}, Nati
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'Lora, Georgia, serif', color: 'var(--text)', lineHeight: 1.3 }}>
          ¿Con qué trabajamos hoy?
        </h1>
      </div>

      {/* Alerts */}
      {(pendingOverdue.length > 0 || pendingUrgent.length > 0) && (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pendingOverdue.map(t => (
            <div key={t.id} onClick={() => nav('/tareas')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fde8e8', border: '1px solid #f5c6c6', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--danger)' }}>Tarea vencida: {t.title}</div>
                <div style={{ fontSize: '11px', color: '#c0392b99' }}>Venció hace {Math.abs(daysLeft(t.due_date))} día{Math.abs(daysLeft(t.due_date)) > 1 ? 's' : ''}</div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Ver →</span>
            </div>
          ))}
          {pendingUrgent.map(t => (
            <div key={t.id} onClick={() => nav('/tareas')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
              <span style={{ fontSize: '16px' }}>🕐</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--warn)' }}>{t.title}</div>
                <div style={{ fontSize: '11px', color: '#d6890099' }}>
                  {daysLeft(t.due_date) === 0 ? 'Vence hoy' : `Vence en ${daysLeft(t.due_date)} día${daysLeft(t.due_date) > 1 ? 's' : ''}`}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--warn)' }}>Ver →</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Pending tasks */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Tareas pendientes</div>
            <Btn variant="ghost" size="sm" onClick={() => nav('/tareas')}>Ver todas</Btn>
          </div>
          {tasks.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>Sin tareas pendientes 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.slice(0, 4).map(t => {
                const d = daysLeft(t.due_date)
                const urgent = d !== null && d <= 2
                return (
                  <div key={t.id} onClick={() => nav('/tareas')} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px', background: 'var(--off-white)', borderRadius: '8px', cursor: 'pointer', border: urgent ? '1px solid #ffe082' : '1px solid transparent', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: '14px', marginTop: '1px' }}>{urgent ? '🔥' : '📝'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                      {t.due_date && (
                        <div style={{ fontSize: '11px', color: urgent ? 'var(--warn)' : 'var(--text-faint)', marginTop: '2px' }}>
                          {d < 0 ? `Venció hace ${Math.abs(d)}d` : d === 0 ? 'Vence hoy' : `${d}d restantes`}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Recent sessions */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Sesiones recientes</div>
            <Btn variant="ghost" size="sm" onClick={() => nav('/mis-pdfs')}>Ver todo</Btn>
          </div>
          {recentDocs.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>
              Subí tu primer PDF para empezar
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentDocs.map(d => (
                <div key={d.id} onClick={() => nav(`/chat/${d.id}`)} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: 'var(--off-white)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--green-pale)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--off-white)'}>
                  <span style={{ fontSize: '16px' }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{d.mentor_role}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>→</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { icon: '📄', label: 'Subir PDF', sub: 'Nueva sesión con mentor', path: '/mis-pdfs', action: 'upload' },
          { icon: '📚', label: 'Programa curricular', sub: 'Bibliografía guiada', path: '/programa' },
          { icon: '✍️', label: 'Mis tareas', sub: `${tasks.length} pendientes`, path: '/tareas' },
        ].map((q, i) => (
          <Card key={i} onClick={() => nav(q.path)} style={{ padding: '16px', cursor: 'pointer' }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{q.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>{q.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.sub}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
