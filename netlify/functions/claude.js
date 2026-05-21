export default async (req) => {
  // Only POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  try {
    const body = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: response.status, headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: err.message } }), { status: 500, headers })
  }
}

export const config = { path: '/api/claude' }
