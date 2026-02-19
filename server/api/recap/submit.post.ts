import { defineEventHandler, readMultipartFormData } from 'h3'
import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No form data' })

  const audio = form.find(f => f.name === 'audio')
  const text = form.find(f => f.name === 'text')
  if (!audio || !text || !audio.data) throw createError({ statusCode: 400, statusMessage: 'audio/text required' })

  const baseDir = '/home/powerdot/Shared/words-trainer/recap'
  fs.mkdirSync(baseDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const audioPath = path.join(baseDir, `${stamp}.webm`)
  const textPath = path.join(baseDir, `${stamp}.txt`)
  fs.writeFileSync(audioPath, audio.data)
  fs.writeFileSync(textPath, String(text.data))

  // Transcribe via OpenAI Whisper
  const formData = new FormData()
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')
  formData.append('file', new Blob([audio.data], { type: audio.type || 'audio/webm' }), 'recap.webm')

  const tr = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: formData
  })
  const trData = await tr.json()
  const transcript = trData?.text || ''

  const transcriptPath = path.join(baseDir, `${stamp}.transcript.txt`)
  fs.writeFileSync(transcriptPath, transcript)

  // Evaluate
  const evalPrompt = `You are an English speaking coach.\n\nORIGINAL TEXT:\n${text.data}\n\nTRANSCRIPT:\n${transcript}\n\nReturn JSON with fields:\nscore (0-100), coverage (0-100), structure (0-100), language (0-100), fluency (0-100), strengths (3 bullets), improvements (3 bullets), fixes (3 short corrected sentences).\nKeep it concise.`

  const er = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: 'You evaluate speaking summaries. Output only JSON.' },
        { role: 'user', content: evalPrompt }
      ],
      temperature: 0.3
    })
  })
  const ed = await er.json()
  const raw = ed?.choices?.[0]?.message?.content || '{}'
  let parsed
  try { parsed = JSON.parse(raw) } catch { parsed = { score: 0, coverage: 0, structure: 0, language: 0, fluency: 0, strengths: [], improvements: [], fixes: [] } }

  const evalPath = path.join(baseDir, `${stamp}.eval.json`)
  fs.writeFileSync(evalPath, JSON.stringify(parsed, null, 2))

  return parsed
})
