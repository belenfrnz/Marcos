import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { callClaude, fileToBase64 } from '../lib/claude.js'
import { buildSystemPrompt, buildTaskPrompt, buildCorrectionPrompt } from '../lib/prompts.js'
import { MENTOR_ROLES } from '../lib/curriculum.js'
import { Btn, Spinner, Badge } from '../components/UI.jsx'

export default function Chat() {
  const { docId } = useParams()
  const user = useAuth()
  const nav = useNavigate()
  const bottomRef = useRef()
  const taRef = useRef()

  const [doc, setDoc] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [taskLoading, setTaskLoading] = useState(false)
  const [sessionN, setSessionN] = useState(1)

  useEffect(() => {
    if (!user || !docId) return
    const init = async () => {
      // Load document
      const { data: d } = await supabase.from('documents').select('*').eq('id', docId).eq('user_id', user.id).single()
      if (!d) { nav('/mis-pdfs'); return }
      setDoc(d)

      // Load messages
      const { data: msgs } = await supabase.from('messages').select('*').eq('document_id', docId).order('created_at', { ascending: true })
      const loaded = msgs || []
      setMessages(loaded)

      // Count sessions (unique days with messages)
      const days = new Set(loaded.map(m => m.created_at?.split('T')[0]))
      setSessionN(Math.max(1, days.size))
      setLoading(false)

      // Auto-greeting if no messages
      if (loaded.length === 0) {
        setTimeout(() => sendGreeting(d, 1), 300)
      }
    }
    init()
  }, [user, docId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const saveMessage = async (role, content) => {
    const { data } = await supabase.from('messages').insert({ document_id: docId, user_id: user.id, role, content }).select().single()
    if (data) setMessages(prev => [...prev, data])
    // Update doc timestamp
    await supabase.from('documents').update({ updated_at: new Date().toISOString() }).eq('id', docId)
    return data
  }

  const buildApiMessages = (msgs, greetingPrompt = null) => {
    if (greetingPrompt) return [{ role: 'user', content: greetingPrompt }]
    // Build with PDF on first message if available
    const result = []
    msgs.forEach((m, i) => {
      if (m.role === 'user' && i === 0 && doc?.pdf_base64) {
        result.push({
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.pdf_base64 } },
            { type: 'text', text: m.content }
          ]
        })
      } else {
        result.push({ role: m.role, content: m.content })
      }
    })
    return result
  }

  const sendGreeting = async (docData, sN) => {
    setSending(true)
    const d = docData || doc
    const system = buildSystemPrompt({ role: d.mentor_role, docTitle: d.title, docContext: d.notes, sessionN: sN })
    const greetPrompt = sN === 1
      ? `[INICIO DE PRIMERA SESIÓN] Nati abrió "${d.title}". Saludala con calidez, preguntale si ya leyó el material. Si tiene el PDF cargado, mencionalo. Sé breve y concreto.`
      : `[SESIÓN ${sN}] Nati vuelve a "${d.title}". Saludá con familiaridad, referenciá brevemente lo trabajado y preguntá qué quiere profundizar.`
    try {
      const reply = await callClaude({ system, messages: [{ role: 'user', content: greetPrompt }] })
      await saveMessage('assistant', reply)
    } catch (e) {
      await saveMessage('assistant', `Hola Nati. Hubo un problema de conexión: ${e.message}`)
    }
    setSending(false)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    setSending(true)
    await saveMessage('user', text)

    try {
      const { data: allMsgs } = await supabase.from('messages').select('*').eq('document_id', docId).order('created_at', { ascending: true })
      const recent = (allMsgs || []).slice(-16)
      const system = buildSystemPrompt({ role: doc.mentor_role, docTitle: doc.title, docContext: doc.notes, sessionN })
      const apiMsgs = buildApiMessages(recent)
      const reply = await callClaude({ system, messages: apiMsgs })
      await saveMessage('assistant', reply)
    } catch (e) {
      await saveMessage('assistant', `Error: ${e.message}`)
    }
    setSending(false)
  }

  const createTask = async () => {
    setTaskLoading(true)
    try {
      const system = buildTaskPrompt({ docTitle: doc.title, docContext: doc.notes, role: doc.mentor_role })
      const raw = await callClaude({ system: 'Respondé SOLO con JSON válido, sin markdown ni backticks.', messages: [{ role: 'user', content: system }], maxTokens: 600 })
      const task = JSON.parse(raw.replace(/```json|```/g, '').trim())
      const due = new Date(); due.setDate(due.getDate() + 7)
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id, document_id: docId,
        title: task.title, description: task.description,
        criteria: task.criteria, estimated_minutes: task.estimated_minutes,
        due_date: due.toISOString().split('T')[0], status: 'pending',
      })
      if (!error) {
        await saveMessage('assistant', `📝 **Tarea asignada:** *${task.title}*\n\n${task.description}\n\n**Se espera:** ${task.criteria}\n\n**Tiempo estimado:** ${task.estimated_minutes} minutos\n**Fecha límite:** ${due.toLocaleDateString('es-AR')}\n\nCuando la tengas lista, mandamela acá mismo y la corrijo. ¿Alguna duda antes de arrancar?`)
      }
    } catch (e) {
      await saveMessage('assistant', `No pude generar la tarea: ${e.message}`)
    }
    setTaskLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const roleMeta = MENTOR_ROLES.find(r => r.id === doc?.mentor_role)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={32} /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--off-white)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
        <button onClick={() => nav('/mis-pdfs')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>← Mis PDFs</button>
        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
        <span style={{ fontSize: '16px' }}>📄</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc?.title}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{roleMeta?.label}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sending ? 'var(--warn)' : 'var(--green-light)' }} />
            <span style={{ fontSize: '11px', color: sending ? 'var(--warn)' : 'var(--green)', fontWeight: '500' }}>
              {sending ? 'Prof. Marcos escribe...' : 'Disponible'}
            </span>
          </div>
          <Btn size="sm" variant="secondary" onClick={createTask} disabled={taskLoading}>
            {taskLoading ? '...' : '📝 Generar tarea'}
          </Btn>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => {
            const isProf = msg.role === 'assistant'
            return (
              <div key={msg.id || i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: isProf ? 'row' : 'row-reverse' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: isProf ? 'var(--green)' : 'var(--green-pale)', border: isProf ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  {isProf ? '🎓' : '👩‍⚕️'}
                </div>
                <div style={{
                  maxWidth: '82%', padding: '12px 16px',
                  background: isProf ? 'var(--white)' : 'var(--green)',
                  border: isProf ? '1px solid var(--border)' : 'none',
                  borderRadius: isProf ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: isProf ? 'var(--green)' : 'rgba(255,255,255,0.7)', marginBottom: '6px', letterSpacing: '1px' }}>
                    {isProf ? 'PROF. MARCOS' : 'VOS'}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.85', color: isProf ? 'var(--text)' : '#fff', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}

          {sending && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🎓</div>
              <div style={{ padding: '14px 18px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '4px 12px 12px 12px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-light)', animation: 'blink 1.2s ease-in-out infinite', animationDelay: `${i*0.18}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea ref={taRef} value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px' }}
            onKeyDown={handleKey} disabled={sending} rows={1}
            placeholder="Escribile al Prof. Marcos... (Enter para enviar)"
            style={{ flex: 1, padding: '11px 14px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', color: 'var(--text)', background: 'var(--off-white)', outline: 'none', resize: 'none', lineHeight: '1.5', maxHeight: '130px', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = 'var(--green)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <Btn onClick={send} disabled={!input.trim() || sending}>Enviar →</Btn>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        textarea::placeholder { color: var(--text-faint); }
      `}</style>
    </div>
  )
}
