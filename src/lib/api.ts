// ═══════════════════════════════════════════════════════════
// ANTHROPIC API CLIENT — Personal Use
// ═══════════════════════════════════════════════════════════

const API_KEY_STORAGE = 'anthropic-api-key'

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE)
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key)
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

interface MessageContent {
  type: string
  text?: string
  source?: {
    type: string
    media_type: string
    data: string
  }
}

interface Message {
  role: 'user' | 'assistant'
  content: string | MessageContent[]
}

interface ApiResponse {
  content: { type: string; text: string }[]
  error?: { type: string; message: string }
}

// Models to try in order of preference
const MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
]

export async function callClaude(
  messages: Message[],
  system: string,
  maxTokens = 1000
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('API key not configured')

  let lastError = ''

  for (const model of MODELS) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system,
          messages,
        }),
      })

      if (res.ok) {
        const data: ApiResponse = await res.json()
        if (data.content) {
          return data.content.map(c => c.text || '').join('') || ''
        }
      }

      const errorBody = await res.text()
      lastError = `${res.status}: ${errorBody}`

      // If auth error, don't try other models
      if (res.status === 401 || res.status === 403) {
        throw new Error(`API key inválida (${res.status})`)
      }

      // If model not found, try next model
      if (res.status === 404 || errorBody.includes('model')) {
        console.warn(`Model ${model} not available, trying next...`)
        continue
      }

      // Other errors
      throw new Error(lastError)
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // Network/CORS error
        throw new Error('Error de red. Verifica tu conexión a internet.')
      }
      throw err
    }
  }

  throw new Error(`Ningún modelo disponible. Último error: ${lastError}`)
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
