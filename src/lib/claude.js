const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY

export async function callClaude({ system, messages, maxTokens = 1200 }) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error?.message || `API error ${resp.status}`)
  return data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''
}

// Convert file to base64
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
