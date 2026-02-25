import { defineEventHandler, readMultipartFormData } from 'h3'
import fs from 'node:fs'
import path from 'node:path'
import * as GPT from '../../utils/GPT'

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

  const baseDir = process.env.INTERVIEW_BASE_DIR || '/tmp/words-trainer-interview';
  fs.mkdirSync(baseDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sessionDir = path.join(baseDir, `${stamp}`)
  fs.mkdirSync(sessionDir, { recursive: true })

  fs.writeFileSync(path.join(sessionDir, 'audio.webm'), audio.data as any)
  fs.writeFileSync(path.join(sessionDir, 'question.txt'), String(question?.data || ''))
  fs.writeFileSync(path.join(sessionDir, 'questionId.txt'), String(qid.data))
  fs.writeFileSync(path.join(sessionDir, 'expected.txt'), String(expected?.data || ''))

  // Transcribe via Whisper
  const formData = new FormData()
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')
  formData.append('file', new Blob([audio.data as any], { type: audio.type || 'audio/webm' }), 'interview.webm')

  const tr = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: formData
  })
  const trData = await tr.json()
  const transcript = trData?.text || ''
  fs.writeFileSync(path.join(sessionDir, 'transcript.txt'), transcript)

  const evaluation = await GPT.ask<{
    verdict: 'acceptable' | 'needs_improvement',
    missing_points: string[],
    short_feedback: string[],
    optional_clarifications: string[]
  }>({
    model: 'gpt-5.2',
    reasoningEffort: 'high',
    jsonSchema: {
      "type": "json_schema",
      "name": "Evaluation",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "verdict": {
            "type": "string",
            "enum": ["acceptable", "needs_improvement"],
            "description": "Overall verdict on the answer."
          },
          "missing_points": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Key points from EXPECTED that are missing in the answer."
          },
          "short_feedback": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Concise bullet points of feedback."
          },
          "optional_clarifications": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Extra clarifications that are not wrong but not required."
          }
        },
        "required": ["verdict", "missing_points", "short_feedback", "optional_clarifications"],
        "additionalProperties": false
      }
    },
    systemPrompt: `You are an interview coach. Compare the candidate's spoken answer to the EXPECTED ANSWER.\n\nRules:\n- If the CORE idea from EXPECTED is present, verdict should be \"acceptable\", even if there are extra clarifications.\n- Do NOT penalize for optional clarifications (e.g., visa mention) if core answer is present.\n- Missing points should be only truly missing key points from EXPECTED.\n\nReturn JSON only with fields:\n- verdict: one of [\"acceptable\", \"needs_improvement\"]\n- missing_points: array of 2-6 key points missing\n- short_feedback: 3-5 concise bullet points\n- optional_clarifications: array of 1-5 items that are extra/optional but not wrong\n\nBe fair and concise.`,
    triggerPrompt: `QUESTION:\n${question?.data || ''}\n\nEXPECTED ANSWER:\n${expected?.data || ''}\n\nTRANSCRIPT:\n${transcript}\n\nEVALUATE the TRANSCRIPT against EXPECTED ANSWER according to the rules and return JSON.`
  });


  fs.writeFileSync(path.join(sessionDir, 'eval.json'), JSON.stringify(evaluation, null, 2));

  await prisma.interviewQA.update({
    where: { id: String(qid.data) },
    data: {
      timesAnswered: { increment: 1 },
      timesCorrect: { increment: evaluation.verdict === 'acceptable' ? 1 : 0 },
      timesIncorrect: { increment: evaluation.verdict === 'needs_improvement' ? 1 : 0 }
    }
  })

  return evaluation;
})
