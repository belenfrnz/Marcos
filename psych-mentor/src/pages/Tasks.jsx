import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { callClaude } from '../lib/claude.js'
import { buildCorrectionPrompt } from '../lib/prompts.js'
import { Card, Btn, Badge, Spinner, EmptyState } from '../components/UI.jsx'

function daysLeft(d) {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / 86400000)
}

export default function Tasks() {
  const user = useAuth()
  const nav = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending') // pending | submitted | done
  const [expanded, setExpanded] = useState(null)
  const [answer, setAnswer] = useState({})
  const [submitting, setSubmitting] = useState(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('tasks').select('*, documents(title)').eq('user_id', user.id).order('due_date', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const filtered = tasks.filter(t =>
    tab === 'pending' ? t.status === 'pending' :
    tab === 'submitted' ? t.status === 'submitted' : t.status === 'graded'
  )

  const submitAnswer = async (task) => {
    const ans = (answer[task.id] || '').trim()
    if (!ans) return
    setSubmitting(task.id)
    try {
      // Get document for context
      const system = buildCorrectionPrompt({ taskTitle: task.title, taskDescription: task.description, taskCriteria: task.criteria, studentAnswer: ans })
      const correction = await callClaude({ system: 'Sos el mentor de Nati. Corregí la tarea con calidez y precisión.', messages: [{ role: 'user', content: system }], maxTokens: 1200 })

      // Extract grade from correction (simple heuristic)
      const match = correction.match(/\b([1-9]|10)\s*(?:\/\s*10|sobre\s*10|puntos?)/i)
      const grade = match ? parseInt(match[1]) : null

      await supabase.from('tasks').update({
        status: 'graded',
        student_answer: ans,
        correction,
        grade,
        graded_at: new Date().toISOString(),
      }).eq('id', task.id)

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'graded', student_answer: ans, correction, grade, graded_at: new Date().toISOString() } : t))
      setAnswer(prev => ({ ...prev, [task.id]: '' }))
      setTab('done')
    } catch (e) {
      alert('Error al enviar: ' + e.message)
    }
    setSubmitting(null)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={32} /></div>

  const tabStyle = (t) => ({
    padding: '7px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    background: tab === t ? 'var(--white)' : 'transparent',
    color: tab === t ? 'var(--green)' : 'var(--text-muted)',
    boxShadow: tab === t ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s',
  })

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'Lora, Georgia, serif' }}>Tareas</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>El Prof. Marcos las asigna desde cada sesión · Entregás acá · Él corrige y califica</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', background: 'var(--green-mist)', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {[['pending','Pendientes'], ['submitted','Entregadas'], ['done','Corregidas']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
            {l} <span style={{ marginLeft: '4px', background: tab === t ? 'var(--green-pale)' : 'var(--border)', color: tab === t ? 'var(--green)' : 'var(--text-muted)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>
              {tasks.filter(x => x.status === t.replace('done','graded')).length || (t === 'done' ? tasks.filter(x => x.status === 'graded').length : 0)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="✍️"
          title={tab === 'pending' ? 'Sin tareas pendientes' : tab === 'submitted' ? 'Ninguna en revisión' : 'Ninguna corregida aún'}
          sub={tab === 'pending' ? 'Las tareas aparecen cuando el Prof. Marcos las asigna en una sesión de chat.' : ''}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(task => {
            const d = daysLeft(task.due_date)
            const urgent = d !== null && d <= 2 && task.status === 'pending'
            const overdue = d !== null && d < 0 && task.status === 'pending'
            const isOpen = expanded === task.id

            return (
              <Card key={task.id} style={{ overflow: 'hidden', border: overdue ? '1px solid #f5c6c6' : urgent ? '1px solid #ffe082' : '1px solid var(--border)' }}>
                {/* Header */}
                <div style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => setExpanded(isOpen ? null : task.id)}>
                  <span style={{ fontSize: '18px' }}>{task.status === 'graded' ? '✅' : overdue ? '⚠️' : urgent ? '🔥' : '📝'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {task.documents?.title && <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>📄 {task.documents.title}</span>}
                      {task.due_date && (
                        <span style={{ fontSize: '11px', color: overdue ? 'var(--danger)' : urgent ? 'var(--warn)' : 'var(--text-faint)', fontWeight: overdue || urgent ? '600' : '400' }}>
                          {overdue ? `Venció hace ${Math.abs(d)}d` : d === 0 ? '⏰ Vence hoy' : `${d}d restantes`}
                        </span>
                      )}
                      {task.grade !== null && task.grade !== undefined && (
                        <Badge color={task.grade >= 7 ? 'var(--green)' : task.grade >= 5 ? 'var(--warn)' : 'var(--danger)'}>
                          {task.grade}/10
                        </Badge>
                      )}
                      {task.estimated_minutes && <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>~{task.estimated_minutes} min</span>}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-faint)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '18px' }}>
                    <div style={{ fontSize: '13px', lineHeight: '1.8', color: 'var(--text-mid)', marginBottom: '14px', background: 'var(--green-mist)', padding: '12px', borderRadius: '8px' }}>
                      {task.description}
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>SE EVALUARÁ:</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-mid)', lineHeight: '1.7', marginBottom: '16px' }}>{task.criteria}</div>

                    {/* Graded: show answer + correction */}
                    {task.status === 'graded' && (
                      <>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>TU RESPUESTA:</div>
                          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.7', whiteSpace: 'pre-wrap', background: 'var(--off-white)', padding: '12px', borderRadius: '8px' }}>{task.student_answer}</div>
                        </div>
                        <div style={{ background: 'var(--green-pale)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px' }}>🎓</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--green)', letterSpacing: '1px' }}>CORRECCIÓN DEL PROF. MARCOS</span>
                            {task.grade !== null && <Badge color={task.grade >= 7 ? 'var(--green)' : 'var(--warn)'}>{task.grade}/10</Badge>}
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.85', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{task.correction}</div>
                        </div>
                      </>
                    )}

                    {/* Pending: answer form */}
                    {task.status === 'pending' && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>TU RESPUESTA:</div>
                        <textarea
                          value={answer[task.id] || ''}
                          onChange={e => setAnswer(prev => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="Escribí tu respuesta acá. Sé detallada — el Prof. Marcos la va a leer y corregir..."
                          rows={6}
                          style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', lineHeight: '1.7', resize: 'vertical', outline: 'none', color: 'var(--text)', background: 'var(--white)' }}
                          onFocus={e => e.target.style.borderColor = 'var(--green)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                          <Btn onClick={() => submitAnswer(task)} disabled={!(answer[task.id] || '').trim() || submitting === task.id}>
                            {submitting === task.id ? 'Enviando y corrigiendo...' : 'Entregar y recibir corrección →'}
                          </Btn>
                          {task.document_id && <Btn variant="ghost" size="sm" onClick={() => nav(`/chat/${task.document_id}`)}>Ir al chat</Btn>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
