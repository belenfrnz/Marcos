// ── Program Page ──────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRICULUM, PRIORITY_LABEL, PRIORITY_COLOR } from '../lib/curriculum.js'
import { Card, Badge } from '../components/UI.jsx'

export function Program() {
  const [open, setOpen] = useState(null)

  return (
    <div style={{ padding: '32px', maxWidth: '860px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'Lora, Georgia, serif' }}>Programa Curricular</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>Bibliografía guiada para tu especialización en psiquiatría · Argentina</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {CURRICULUM.map((area, ai) => (
          <div key={ai}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>{area.icon}</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: area.color }}>{area.area}</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {area.items.map((item, ii) => {
                const key = `${ai}-${ii}`
                const isOpen = open === key
                return (
                  <Card key={ii} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                      onClick={() => setOpen(isOpen ? null : key)}>
                      <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: PRIORITY_COLOR[item.priority], flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.source}</div>
                      </div>
                      <Badge color={PRIORITY_COLOR[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>
                      <span style={{ color: 'var(--text-faint)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--green-mist)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '1px' }}>PUNTOS CLAVE A DOMINAR:</div>
                        <div style={{ fontSize: '13px', lineHeight: '1.8', color: 'var(--text-mid)' }}>{item.focus}</div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', padding: '18px', background: 'var(--green-pale)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--text-mid)', lineHeight: '1.7' }}>
        💡 <strong>Cómo usar este programa:</strong> Leé el material, abrí una sesión con el Prof. Marcos subiendo el PDF correspondiente, y pedile que te asigne una tarea al terminar. Los ítems marcados como <strong>Esencial</strong> son prioritarios para la residencia.
      </div>
    </div>
  )
}

// ── Search Page ───────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Spinner } from '../components/UI.jsx'

export function Search() {
  const user = useAuth()
  const nav = useNavigate()
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState([])
  const [tasks, setTasks] = useState([])
  const [msgs, setMsgs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = async () => {
    if (!query.trim() || !user) return
    setLoading(true); setSearched(true)
    const q = query.toLowerCase()
    const [{ data: d }, { data: t }, { data: m }] = await Promise.all([
      supabase.from('documents').select('id,title,mentor_role,updated_at').eq('user_id', user.id).ilike('title', `%${q}%`),
      supabase.from('tasks').select('id,title,description,status,due_date,document_id').eq('user_id', user.id).or(`title.ilike.%${q}%,description.ilike.%${q}%`),
      supabase.from('messages').select('id,content,role,document_id,created_at,documents(title)').eq('user_id', user.id).ilike('content', `%${q}%`).order('created_at', { ascending: false }).limit(8),
    ])
    setDocs(d || []); setTasks(t || []); setMsgs(m || [])
    setLoading(false)
  }

  const total = docs.length + tasks.length + msgs.length

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'Lora, Georgia, serif', marginBottom: '16px' }}>Buscar</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Buscar en PDFs, tareas y chats..."
            style={{ flex: 1, padding: '11px 14px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', color: 'var(--text)', background: 'var(--white)', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--green)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
            autoFocus
          />
          <button onClick={doSearch} disabled={!query.trim() || loading}
            style={{ padding: '11px 20px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            {loading ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div>}

      {searched && !loading && total === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Sin resultados para "{query}"
        </div>
      )}

      {docs.length > 0 && (
        <Section title="📄 Documentos" count={docs.length}>
          {docs.map(d => (
            <ResultRow key={d.id} title={d.title} sub={new Date(d.updated_at).toLocaleDateString('es-AR')} onClick={() => nav(`/chat/${d.id}`)} />
          ))}
        </Section>
      )}

      {tasks.length > 0 && (
        <Section title="✍️ Tareas" count={tasks.length}>
          {tasks.map(t => (
            <ResultRow key={t.id} title={t.title} sub={t.status === 'graded' ? 'Corregida' : t.status === 'pending' ? 'Pendiente' : 'Entregada'} onClick={() => nav('/tareas')} />
          ))}
        </Section>
      )}

      {msgs.length > 0 && (
        <Section title="💬 Mensajes en chats" count={msgs.length}>
          {msgs.map(m => (
            <ResultRow key={m.id}
              title={m.documents?.title || 'Documento'}
              sub={m.content.slice(0, 100) + (m.content.length > 100 ? '...' : '')}
              onClick={() => nav(`/chat/${m.document_id}`)}
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>
        {title} <span style={{ opacity: 0.6 }}>({count})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</div>
    </div>
  )
}

function ResultRow({ title, sub, onClick }) {
  return (
    <Card onClick={onClick} style={{ padding: '12px 16px', cursor: 'pointer' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
    </Card>
  )
}
