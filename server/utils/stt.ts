export type NormalizedSTT = {
  text: string
  segments?: Array<{ startMs: number; endMs: number; text: string }>
  words?: Array<{ word: string; startMs: number; endMs: number }>
}

export type STTProvider = 'openai'

export function getSTTProvider(): STTProvider {
  const raw = String(process.env.STT_PROVIDER || 'openai').toLowerCase()
  return raw === 'openai' ? 'openai' : 'openai'
}

export async function transcribeAudio(params: {
  audio: Buffer
  mimeType?: string
  language?: string
}): Promise<NormalizedSTT> {
  const provider = getSTTProvider()
  if (provider !== 'openai') throw new Error('Unsupported STT provider')

  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY missing')

  const form = new FormData()
  form.append('model', 'whisper-1')
  form.append('language', params.language || 'en')
  form.append('file', new Blob([params.audio as any], { type: params.mimeType || 'audio/webm' }), 'audio.webm')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form
  })

  if (!res.ok) throw new Error(`STT failed: ${res.status}`)
  const data = await res.json()

  return {
    text: String(data?.text || '').trim()
  }
}
