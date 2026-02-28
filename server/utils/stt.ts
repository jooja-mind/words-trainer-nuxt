export type NormalizedSTT = {
  text: string
  segments?: Array<{ startMs: number; endMs: number; text: string }>
  words?: Array<{ word: string; startMs: number; endMs: number }>
}

export type STTProvider = 'openai' | 'openai_timestamps'

export function getSTTProvider(): STTProvider {
  const raw = String(process.env.STT_PROVIDER || 'openai').toLowerCase()
  if (raw === 'openai_timestamps') return 'openai_timestamps'
  return 'openai'
}

export async function transcribeAudio(params: {
  audio: Buffer
  mimeType?: string
  language?: string
}): Promise<NormalizedSTT> {
  const provider = getSTTProvider()

  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY missing')

  const form = new FormData()
  form.append('model', 'whisper-1')
  form.append('language', params.language || 'en')
  form.append('file', new Blob([params.audio as any], { type: params.mimeType || 'audio/webm' }), 'audio.webm')

  if (provider === 'openai_timestamps') {
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'segment')
  }

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form
  })

  if (!res.ok) throw new Error(`STT failed: ${res.status}`)
  const data = await res.json()

  const text = String(data?.text || '').trim()

  const segments = Array.isArray(data?.segments)
    ? data.segments
        .map((s: any) => ({
          startMs: Number(s?.start || 0) * 1000,
          endMs: Number(s?.end || 0) * 1000,
          text: String(s?.text || '').trim()
        }))
        .filter((s: any) => s.text)
    : undefined

  return {
    text,
    segments
  }
}
