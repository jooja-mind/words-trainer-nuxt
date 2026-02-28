import { defineEventHandler, readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No form data' })

  const audio = form.find((f) => f.name === 'audio')
  if (!audio?.data) throw createError({ statusCode: 400, statusMessage: 'audio is required' })

  const sttForm = new FormData()
  sttForm.append('model', 'whisper-1')
  sttForm.append('language', 'en')
  sttForm.append('file', new Blob([audio.data as any], { type: audio.type || 'audio/webm' }), 'fluency.webm')

  const tr = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: sttForm
  })

  if (!tr.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Transcription failed' })
  }

  const data = await tr.json()
  return { text: String(data?.text || '').trim() }
})
