import { defineEventHandler, readMultipartFormData } from 'h3'
import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No form data' })

  const audio = form.find(f => f.name === 'audio')
  const qid = form.find(f => f.name === 'questionId')
  const question = form.find(f => f.name === 'question')
  const expected = form.find(f => f.name === 'expected')

  if (!audio || !audio.data || !qid) throw createError({ statusCode: 400, statusMessage: 'audio/questionId required' })

  const baseDir = '/home/powerdot/Shared/words-trainer/interview'
  fs.mkdirSync(baseDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sessionDir = path.join(baseDir, `${stamp}`)
  fs.mkdirSync(sessionDir, { recursive: true })

  fs.writeFileSync(path.join(sessionDir, 'audio.webm'), audio.data)
  fs.writeFileSync(path.join(sessionDir, 'question.txt'), String(question?.data || ''))
  fs.writeFileSync(path.join(sessionDir, 'questionId.txt'), String(qid.data))
  fs.writeFileSync(path.join(sessionDir, 'expected.txt'), String(expected?.data || ''))

  // Transcribe via Whisper
  const formData = new FormData()
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')
  formData.append('file', new Blob([audio.data], { type: audio.type || 'audio/webm' }), 'interview.webm')

  const tr = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: formData
  })
  const trData = await tr.json()
  const transcript = trData?.text || ''
  fs.writeFileSync(path.join(sessionDir, 'transcript.txt'), transcript)

  const evalPrompt = `You are an interview coach. Compare the candidate's spoken answer to the EXPECTED ANSWER.\n\nQUESTION:\n${question?.data || ''}\n\nEXPECTED ANSWER:\n${expected?.data || ''}\n\nTRANSCRIPT:\n${transcript}\n\nReturn JSON only with fields:\n- verdict: one of ["acceptable", "needs_improvement"]\n- missing_points: array of 3-7 key points that are present in EXPECTED but missing or weak in TRANSCRIPT\n- short_feedback: 3-5 concise bullet points\n\nBe strict but fair.`

  const er = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: 'You evaluate interview answers. Output only JSON.' },
        { role: 'user', content: evalPrompt }
      ],
      temperature: 0.2
    })
  })
  const ed = await er.json()
  const raw = ed?.choices?.[0]?.message?.content || '{}'
  let parsed
  try { parsed = JSON.parse(raw) } catch { parsed = { verdict: 'needs_improvement', missing_points: [], short_feedback: [] } }

  fs.writeFileSync(path.join(sessionDir, 'eval.json'), JSON.stringify(parsed, null, 2))

  return parsed
})
