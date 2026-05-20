import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { callClaude } from '../lib/claude.js'
import { MENTOR_ROLES } from '../lib/curriculum.js'
import { Btn, Spinner, Badge, useTheme } from '../components/UI.jsx'

const FREE_CHAT_ID = 'free_chat'

const SYSTEM = `Sos el Profesor Marcos, mentor socrático de Nati, residente de psiquiatría en Argentina.
Nati es analítica, exigente consigo misma, con intereses en farmacología, neurociencia clínica y cognición.
Hablás en español rioplatense, usás "vos". Sos cálido pero exigente.

En este chat Nati puede hablar libremente sobre cualquier tema clínico, consultarte dudas de guardia, pedirte que analices un PDF que adjunta, o simplemente pensar en voz alta.
Si adjunta un PDF, lo leés y respondés sobre ese contenido específicamente.
Si la consulta es clínica y urgente, priorizás claridad y precisión.
Siempre terminás con una pregunta o invitación concreta. Máximo 3-4 párrafos por respuesta.`

export default function FreeChat() {
  const user = useAuth()
  const nav = useNavigate()
  const bottomRef = useRef()
  const taRef = useRef()
  const fileRef = useRef()
  useTheme()

  const [messages, setMessages] = useState([])   // {id, role, content, pdfName?, pdfData?}
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingPDF, setPendingPDF] = useState(null)  // {name, base64, size}
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [taskLoading, setTaskLoading] = useState(false)

  // Load history from supabase (using document_id = FREE_CHAT_ID convention)
  useEffect(() => {
    if (!user) return
    supabase.from('messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('document_id', FREE_CHAT_ID)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data || [])
        setLoadingHistory(false)
        if ((data || []).length === 0) sendGreeting()
      })
  }, [user])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  const saveMsg = async (role, content, extra = {}) => {
    const { data } = await supabase.from('messages').insert({
      document_id: FREE_CHAT_ID,
      user_id: user.id,
      role,
      content,
      ...extra,
    }).select().single()
    if (data) setMessages(prev => [...prev, data])
    return data
  }

  const sendGreeting = async () => {
    setSending(true)
    try {
      const reply = await callClaude({
        system: SYSTEM,
        messages: [{ role: 'user', content: '[INICIO] Nati abre el chat libre. Saludala con calidez, decile que acá puede preguntarte cualquier cosa, adjuntar PDFs, o hablar de lo que quiera. Sé muy breve — 2-3 líneas máximo.' }],
      })
      await saveMsg('assistant', reply)
    } catch (e) {
      await saveMsg('assistant', `Hola Nati 👋 Acá podés preguntarme lo que quieras — dudas de guardia, teoría, casos. Y si querés que analice un PDF, lo adjuntás directamente acá.`)
    }
    setSending(false)
  }

  const handleFile = (file) => {
    if (!file || file.type !== 'application/pdf') return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      setPendingPDF({ name: file.name, base64, size: file.size })
    }
    reader.readAsDataURL(file)
  }

  const send = async () => {
    const text = input.trim()
    if (!text && !pendingPDF) return
    if (sending) return

    const userContent = text || (pendingPDF ? `[Adjunté el PDF: ${pendingPDF.name}]` : '')
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'

    // Save user message with pdf metadata if present
    const savedUser = await saveMsg('user', userContent, pendingPDF ? { pdf_name: pendingPDF.name } : {})
    const pdf = pendingPDF
    setPendingPDF(null)
    setSending(true)

    try {
      // Build API messages — include PDF in this turn if present
      const { data: allMsgs } = await supabase.from('messages')
        .select('*').eq('document_id', FREE_CHAT_ID).eq('user_id', user.id)
        .order('created_at', { ascending: true })

      const recent = (allMsgs || []).slice(-16)

      const apiMessages = recent.map((m, i) => {
        const isLast = i === recent.length - 1
        // Attach PDF to the last user message if we have one
        if (m.role === 'user' && isLast && pdf) {
          return {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.base64 } },
              { type: 'text', text: m.content !== `[Adjunté el PDF: ${pdf.name}]` ? m.content : `Analizá este PDF: ${pdf.name}` }
            ]
          }
        }
        return { role: m.role, content: m.content }
      })

      const reply = await callClaude({ system: SYSTEM, messages: apiMessages })
      await saveMsg('assistant', reply)
    } catch (e) {
      await saveMsg('assistant', `Error: ${e.message}. Intentá de nuevo.`)
    }
    setSending(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const clearChat = async () => {
    if (!confirm('¿Borrar todo el historial de este chat?')) return
    await supabase.from('messages').delete().eq('document_id', FREE_CHAT_ID).eq('user_id', user.id)
    setMessages([])
    sendGreeting()
  }

  if (loadingHistory) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Spinner size={32} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ background: 'var(--accent)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button onClick={() => nav('/')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}>←</button>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Prof. Marcos</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sending ? '#fbbf24' : '#86efac' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{sending ? 'escribiendo...' : 'disponible'}</span>
          </div>
        </div>
        <button onClick={clearChat} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>
          ↺ Limpiar
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((msg, i) => {
            const isProf = msg.role === 'assistant'
            return (
              <div key={msg.id || i} className="fade-in" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: isProf ? 'row' : 'row-reverse' }}>
                {isProf && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, marginBottom: '2px' }}>🎓</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '11px 14px',
                  background: isProf ? 'var(--card)' : 'var(--accent)',
                  border: isProf ? '1px solid var(--border)' : 'none',
                  borderRadius: isProf ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  {msg.pdf_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '6px 10px', background: isProf ? 'var(--accent-mist)' : 'rgba(255,255,255,0.15)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '14px' }}>📄</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: isProf ? 'var(--accent)' : 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{msg.pdf_name}</span>
                    </div>
                  )}
                  <div style={{ fontSize: '14px', lineHeight: '1.75', color: isProf ? 'var(--text)' : '#fff', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}

          {sending && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🎓</div>
              <div style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', opacity: 0.5, animation: 'blink 1.2s ease-in-out infinite', animationDelay: `${i*0.18}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* PDF preview badge */}
      {pendingPDF && (
        <div style={{ padding: '8px 16px', background: 'var(--accent-pale)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>📄</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingPDF.name}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(pendingPDF.size / 1024 / 1024).toFixed(1)} MB</span>
          <button onClick={() => setPendingPDF(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '2px' }}>×</button>
        </div>
      )}

      {/* Input area */}
      <div style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', padding: '12px 16px', flexShrink: 0, paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            {/* PDF button */}
            <button onClick={() => fileRef.current?.click()}
              style={{ width: '40px', height: '40px', borderRadius: '12px', border: `1.5px solid ${pendingPDF ? 'var(--accent)' : 'var(--border)'}`, background: pendingPDF ? 'var(--accent-pale)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, transition: 'all 0.15s' }}
              title="Adjuntar PDF">
              📎
            </button>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} />

            {/* Text input */}
            <textarea ref={taRef} value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              onKeyDown={handleKey} disabled={sending} rows={1}
              placeholder={pendingPDF ? `Preguntale algo sobre "${pendingPDF.name}"...` : 'Escribile al Prof. Marcos...'}
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text)', background: 'var(--surface)', outline: 'none', resize: 'none', lineHeight: '1.5', maxHeight: '120px', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            {/* Send button */}
            <button onClick={send} disabled={(!input.trim() && !pendingPDF) || sending}
              style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: (!input.trim() && !pendingPDF) || sending ? 'var(--border)' : 'var(--accent)', color: (!input.trim() && !pendingPDF) || sending ? 'var(--text-faint)' : '#fff', cursor: (!input.trim() && !pendingPDF) || sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, transition: 'all 0.15s' }}>
              ↑
            </button>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)', textAlign: 'center', marginTop: '6px' }}>
            Enter · enviar &nbsp;·&nbsp; Shift+Enter · nueva línea &nbsp;·&nbsp; 📎 adjuntar PDF
          </div>
        </div>
      </div>

      <style>{`textarea::placeholder { color: var(--text-faint); }`}</style>
    </div>
  )
}
