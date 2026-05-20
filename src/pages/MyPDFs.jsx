import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { Card, Btn, Badge, Input, Spinner, EmptyState } from '../components/UI.jsx'
import { MENTOR_ROLES } from '../lib/curriculum.js'

export default function MyPDFs() {
  const user = useAuth()
  const nav = useNavigate()
  const fileRef = useRef()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ title: '', role: 'socratico', notes: '' })
  const [file, setFile] = useState(null)
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('documents').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || (d.notes || '').toLowerCase().includes(search.toLowerCase()))

  const handleUpload = async () => {
    if (!file || !form.title.trim()) return
    setUploading(true); setError('')
    try {
      // Read file as base64 for storage
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1]
        const { data, error: err } = await supabase.from('documents').insert({
          user_id: user.id,
          title: form.title.trim(),
          mentor_role: form.role,
          notes: form.notes,
          pdf_base64: base64,
          file_name: file.name,
          file_size: file.size,
        }).select().single()
        if (err) { setError(err.message); setUploading(false); return }
        setDocs(prev => [data, ...prev])
        setShowUpload(false)
        setForm({ title: '', role: 'socratico', notes: '' })
        setFile(null)
        setUploading(false)
        nav(`/chat/${data.id}`)
      }
    } catch (e) { setError(e.message); setUploading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminás este documento y todo su historial de chat?')) return
    await supabase.from('documents').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const handleRename = async (id) => {
    if (!editTitle.trim()) return
    await supabase.from('documents').update({ title: editTitle.trim() }).eq('id', id)
    setDocs(prev => prev.map(d => d.id === id ? { ...d, title: editTitle.trim() } : d))
    setEditId(null)
  }

  const roleLabel = (r) => MENTOR_ROLES.find(x => x.id === r)?.label || r

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={32} /></div>

  return (
    <div style={{ padding: '32px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'Lora, Georgia, serif' }}>Mis PDFs</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>Subí cualquier PDF y abrí una sesión con el mentor</p>
        </div>
        <Btn onClick={() => setShowUpload(true)}>+ Subir PDF</Btn>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <Input placeholder="Buscar por título o notas..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '400px' }} />
      </div>

      {/* Upload panel */}
      {showUpload && (
        <Card style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--green)', background: 'var(--green-mist)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '18px', color: 'var(--green)' }}>Nuevo documento</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input label="Título del documento" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Kaplan Cap. 7 – Esquizofrenia" />

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', display: 'block', marginBottom: '6px' }}>Rol del mentor</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--white)', color: 'var(--text)', outline: 'none' }}>
                {MENTOR_ROLES.map(r => <option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
              </select>
            </div>

            <Input label="Notas opcionales (contexto para el mentor)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ej: Paper de revisión, me interesa la metodología" />

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', display: 'block', marginBottom: '6px' }}>Archivo PDF</label>
              <div onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'var(--white)', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                {file ? (
                  <div>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>📄</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--green)' }}>{file.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>📂</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-mid)', fontWeight: '500' }}>Hacé click para seleccionar un PDF</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '3px' }}>Máx. 5 MB recomendado (1 capítulo a la vez)</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0] || null)} />
            </div>

            {error && <div style={{ padding: '10px', background: '#fde8e8', border: '1px solid #f5c6c6', borderRadius: '7px', fontSize: '12px', color: 'var(--danger)' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn onClick={handleUpload} disabled={!file || !form.title.trim() || uploading}>
                {uploading ? 'Subiendo...' : 'Subir y abrir sesión →'}
              </Btn>
              <Btn variant="ghost" onClick={() => { setShowUpload(false); setFile(null); setError('') }}>Cancelar</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Doc list */}
      {filtered.length === 0 ? (
        <EmptyState icon="📄" title="Sin documentos" sub="Subí tu primer PDF para empezar una sesión con el Prof. Marcos."
          action={<Btn onClick={() => setShowUpload(true)}>+ Subir PDF</Btn>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(doc => (
            <Card key={doc.id} style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editId === doc.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(doc.id); if (e.key === 'Escape') setEditId(null) }}
                        style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--green)', borderRadius: '6px', fontSize: '13px', outline: 'none' }} autoFocus />
                      <Btn size="sm" onClick={() => handleRename(doc.id)}>Guardar</Btn>
                      <Btn size="sm" variant="ghost" onClick={() => setEditId(null)}>✕</Btn>
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge>{roleLabel(doc.mentor_role)}</Badge>
                    {doc.notes && <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontStyle: 'italic' }}>{doc.notes}</span>}
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{new Date(doc.updated_at).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <Btn size="sm" onClick={() => nav(`/chat/${doc.id}`)}>Abrir →</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => { setEditId(doc.id); setEditTitle(doc.title) }}>✏️</Btn>
                  <Btn size="sm" variant="danger" onClick={() => handleDelete(doc.id)}>🗑</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
