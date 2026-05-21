import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { callClaude } from '../lib/claude.js'
import { useTheme } from '../components/UI.jsx'

const SYSTEM = `Sos el Profesor Marcos, mentor socrático de Nati, residente de psiquiatría en Argentina.
Nati es analítica, con intereses en farmacología, neurociencia clínica y cognición.
Hablás en español rioplatense, usás "vos". Sos cálido pero exigente.
Acá Nati puede consultarte dudas de guardia, pedirte que analices un PDF, o hablar libremente de cualquier tema clínico.
Si adjunta un PDF, lo analizás en profundidad.
Siempre terminás con una pregunta concreta. Máximo 3 párrafos por respuesta.`

export default function FreeChat() {
  const user = useAuth()
  const nav = useNavigate()
  const bottomRef = useRef()
  const taRef = useRef()
  const fileRef = useRef()
  useTheme()

  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingPDF, setPendingPDF] = useState(null)
  const [booted, setBooted] = useState(false)

  // Scroll to bottom whenever msgs change
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [msgs, sending])

  // Boot: load from DB or send greeting
  useEffect(() => {
    if (!user || booted) return
    setBooted(true)
    ;(async () => {
      try {
        const { data } = await supabase
          .from('free_chat_messages')
          .select('id, role, content, pdf_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(60)

        if (data && data.length > 0) {
          setMsgs(data)
        } else {
          // No history — send greeting
          setSending(true)
          const reply = await callClaude({
            system: SYSTEM,
            messages: [{ role: 'user', content: 'Saludá a Nati brevemente, 2 líneas. Decile que puede preguntarte lo que quiera y adjuntar PDFs cuando quiera.' }],
          })
          const greeting = { id: crypto.randomUUID(), role: 'assistant', content: reply, pdf_name: null }
          setMsgs([greeting])
          setSending(false)
          supabase.from('free_chat_messages').insert({ user_id: user.id, role: 'assistant', content: reply }).then(() => {})
        }
      } catch (e) {
        console.error('FreeChat boot error', e)
        setSending(false)
      }
    })()
  }, [user, booted])

  const handleFile = (file) => {
    if (!file || file.type !== 'application/pdf') return
    const reader = new FileReader()
    reader.onload = () => setPendingPDF({ name: file.name, base64: reader.result.split(',')[1], size: file.size })
    reader.readAsDataURL(file)
  }

  const send = async () => {
    const text = input.trim()
    if ((!text && !pendingPDF) || sending) return

    const userContent = text || `Adjunté el PDF: ${pendingPDF.name}`
    const pdf = pendingPDF

    // 1. Clear inputs immediately
    setInput('')
    setPendingPDF(null)
    if (taRef.current) taRef.current.style.height = 'auto'

    // 2. Add user bubble to state immediately
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: userContent, pdf_name: pdf?.name || null }
    setMsgs(prev => [...prev, userMsg])
    setSending(true)

    // 3. Persist user message (non-blocking)
    supabase.from('free_chat_messages').insert({ user_id: user.id, role: 'user', content: userContent, pdf_name: pdf?.name || null }).then(() => {})

    // 4. Build API messages from current state + new user msg
    const context = [...msgs, userMsg].slice(-14)
    const apiMessages = context.map((m, i) => {
      const isLast = i === context.length - 1
      if (m.role === 'user' && isLast && pdf) {
        return {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.base64 } },
            { type: 'text', text: text || `Analizá este PDF: ${pdf.name}` }
          ]
        }
      }
      return { role: m.role, content: m.content }
    })

    // 5. Call Claude
    try {
      const reply = await callClaude({ system: SYSTEM, messages: apiMessages })
      const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: reply, pdf_name: null }
      setMsgs(prev => [...prev, assistantMsg])
      supabase.from('free_chat_messages').insert({ user_id: user.id, role: 'assistant', content: reply }).then(() => {})
    } catch (e) {
      setMsgs(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${e.message}` }])
    }
    setSending(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const clearChat = async () => {
    if (!confirm('¿Borrar todo el historial?')) return
    await supabase.from('free_chat_messages').delete().eq('user_id', user.id)
    setMsgs([])
    setBooted(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8faf8', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ background: 'var(--accent)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <button onClick={() => nav('/')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}>←</button>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🎓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>Prof. Marcos</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
            {sending ? '✍️ escribiendo...' : '● disponible'}
          </div>
        </div>
        <button onClick={clearChat} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'rgba(255,255,255,0.75)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>↺ limpiar</button>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        <div style={{ maxWidth: '660px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {msgs.length === 0 && !sending && (
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: '13px', padding: '40px 0' }}>Iniciando conversación...</div>
          )}

          {msgs.map((msg) => {
            const isProf = msg.role === 'assistant'
            return (
              <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: isProf ? 'row' : 'row-reverse' }}>
                {isProf && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>🎓</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 13px',
                  background: isProf ? '#fff' : 'var(--accent)',
                  border: isProf ? '1px solid #e8eee8' : 'none',
                  borderRadius: isProf ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {msg.pdf_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '7px', padding: '4px 8px', background: isProf ? '#f0faf2' : 'rgba(255,255,255,0.18)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px' }}>📄</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: isProf ? 'var(--accent)' : 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{msg.pdf_name}</span>
                    </div>
                  )}
                  <div style={{ fontSize: '14px', lineHeight: '1.72', color: isProf ? '#1a1a1a' : '#fff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {sending && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🎓</div>
              <div style={{ padding: '12px 16px', background: '#fff', border: '1px solid #e8eee8', borderRadius: '4px 14px 14px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', animation: 'blink 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s`, opacity: 0.5 }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} style={{ height: '4px' }} />
        </div>
      </div>

      {/* ── PDF preview ── */}
      {pendingPDF && (
        <div style={{ padding: '8px 16px', background: '#d8f3dc', borderTop: '1px solid #b7dfc0', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>📄</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingPDF.name}</span>
          <span style={{ fontSize: '11px', color: '#6b8a6b' }}>{(pendingPDF.size / 1024 / 1024).toFixed(1)} MB</span>
          <button onClick={() => setPendingPDF(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b8a6b', lineHeight: 1, padding: '2px 4px' }}>×</button>
        </div>
      )}

      {/* ── Input ── */}
      <div style={{ background: '#fff', borderTop: '1px solid #e8eee8', padding: '10px 12px', flexShrink: 0 }}>
        <div style={{ maxWidth: '660px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{ width: '38px', height: '38px', borderRadius: '10px', border: `1.5px solid ${pendingPDF ? 'var(--accent)' : '#e0e8e0'}`, background: pendingPDF ? '#d8f3dc' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}
            title="Adjuntar PDF"
          >📎</button>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} />

          <textarea
            ref={taRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'
            }}
            onKeyDown={handleKey}
            disabled={sending}
            rows={1}
            placeholder={pendingPDF ? `Preguntá sobre "${pendingPDF.name}"...` : 'Escribile al Prof. Marcos...'}
            style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e0e8e0', borderRadius: '10px', fontSize: '14px', color: '#1a1a1a', background: '#f8faf8', outline: 'none', resize: 'none', lineHeight: '1.5', maxHeight: '110px', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = '#e0e8e0'}
          />

          <button
            onClick={send}
            disabled={(!input.trim() && !pendingPDF) || sending}
            style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', background: (!input.trim() && !pendingPDF) || sending ? '#e0e8e0' : 'var(--accent)', color: (!input.trim() && !pendingPDF) || sending ? '#a0b4a0' : '#fff', cursor: (!input.trim() && !pendingPDF) || sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, transition: 'all 0.15s', fontWeight: '700' }}
          >↑</button>
        </div>
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#c0d0c0', marginTop: '5px' }}>Enter · enviar &nbsp;·&nbsp; Shift+Enter · nueva línea &nbsp;·&nbsp; 📎 PDF</div>
      </div>
    </div>
  )
}
