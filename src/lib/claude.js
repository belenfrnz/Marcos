// Llama a la Netlify Function (proxy seguro) en vez de Anthropic directamente
export async function callClaude({ system, messages, maxTokens = 1200 }) {
  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error?.message || `Error ${resp.status}`)
  return data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
