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
}

export async function callClaude(
  messages: Message[],
  system: string,
  maxTokens = 1000
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('API key not configured')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API error ${res.status}: ${error}`)
  }

  const data: ApiResponse = await res.json()
  return data.content?.map(c => c.text || '').join('') || ''
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
