import { defineEventHandler, readMultipartFormData } from 'h3'
import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No form data' })

  const audio = form.find(f => f.name === 'audio')
  const qid = form.find(f => f.name === 'questionId')
  const question = form.find(f => f.name === 'question')
  if (!audio || !audio.data || !qid) throw createError({ statusCode: 400, statusMessage: 'audio/questionId required' })

  const baseDir = '/home/powerdot/Shared/words-trainer/interview'
  fs.mkdirSync(baseDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sessionDir = path.join(baseDir, `${stamp}`)
  fs.mkdirSync(sessionDir, { recursive: true })

  fs.writeFileSync(path.join(sessionDir, 'audio.webm'), audio.data)
  fs.writeFileSync(path.join(sessionDir, 'question.txt'), String(question?.data || ''))
  fs.writeFileSync(path.join(sessionDir, 'questionId.txt'), String(qid.data))

  return { ok: true, savedAt: stamp }
})
