import { defineEventHandler, readMultipartFormData } from 'h3'
import fs from 'node:fs'
import path from 'node:path'
import * as GPT from '../../utils/GPT'
import { updateDailyProgress } from '../../utils/daily'

function inferErrorType(line: string): 'ARTICLE' | 'TENSE' | 'VERB_FORM' | 'PREPOSITION' | 'WORD_CHOICE' {
  const t = line.toLowerCase()
  if (t.includes('article')) return 'ARTICLE'
  if (t.includes('tense') || t.includes('past') || t.includes('present') || t.includes('perfect')) return 'TENSE'
  if (t.includes('verb')) return 'VERB_FORM'
  if (t.includes('preposition')) return 'PREPOSITION'
  return 'WORD_CHOICE'
}

export default defineEventHandler(async (event) => {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No form data' })

  const audio = form.find(f => f.name === 'audio')
  const text = form.find(f => f.name === 'text')
  if (!audio || !text || !audio.data) throw createError({ statusCode: 400, statusMessage: 'audio/text required' })

  const baseDir = process.env.RECAP_BASE_DIR || '/tmp/words-trainer-recap';
  fs.mkdirSync(baseDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sessionDir = path.join(baseDir, stamp)
  fs.mkdirSync(sessionDir, { recursive: true })

  const audioPath = path.join(sessionDir, `audio.webm`)
  const textPath = path.join(sessionDir, `text.txt`)
  fs.writeFileSync(audioPath, audio.data as any)
  fs.writeFileSync(textPath, String(text.data))

  const transcriptionEndpoint = 'https://api.openai.com/v1/audio/transcriptions'
  const audioMime = audio.type || 'audio/webm'

  async function transcribeWithModel(model: 'gpt-4o-transcribe' | 'whisper-1') {
    const formData = new FormData()
    formData.append('model', model)
    formData.append('language', 'en')
    formData.append('file', new Blob([audio.data as any], { type: audioMime }), 'recap.webm')

    const tr = await fetch(transcriptionEndpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: formData
    })

    let trData: any = null
    try {
      trData = await tr.json()
    } catch {
      trData = { error: { message: 'Non-JSON transcription response' } }
    }

    return {
      ok: tr.ok,
      status: tr.status,
      model,
      data: trData,
      text: String(trData?.text || '').trim()
    }
  }

  const primary = await transcribeWithModel('gpt-4o-transcribe')
  const fallback = (!primary.ok || !primary.text) ? await transcribeWithModel('whisper-1') : null

  const chosen = (fallback && fallback.ok && fallback.text) ? fallback : primary

  const sttDebugPath = path.join(sessionDir, 'stt-response.json')
  fs.writeFileSync(sttDebugPath, JSON.stringify({ primary, fallback }, null, 2))

  if (!chosen.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Transcription failed (${chosen.model}, HTTP ${chosen.status})`
    })
  }

  if (!chosen.text) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Transcription is empty. Please re-record with clearer speech.'
    })
  }

  const transcript = chosen.text
  const transcriptPath = path.join(sessionDir, `transcript.txt`)
  fs.writeFileSync(transcriptPath, transcript)

  // Evaluate
  const evalResult = await GPT.ask<{
    score: number,
    coverage: number,
    structure: number,
    language: number,
    fluency: number,
    strengths: string[],
    improvements: string[],
    fixes: string[]
  }>({
    model: 'gpt-5.2',
    reasoningEffort: 'high',
    jsonSchema: {
      "type": "json_schema",
      "name": "EvaluationResult",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "score": { "type": "number", "description": "Overall score 0-100" },
          "coverage": { "type": "number", "description": "How much of the original text was covered, 0-100" },
          "structure": { "type": "number", "description": "How well structured the retelling is, 0-100" },
          "language": { "type": "number", "description": "Language quality, 0-100" },
          "fluency": { "type": "number", "description": "Fluency and naturalness, 0-100" },
          "strengths": { 
            "type": "array", 
            "description": "Strengths of the retelling in 3 bullet points",
            "items": { "type": "string" }
          },
          "improvements": { 
            "type": "array", 
            "description": "Areas for improvement in 3 bullet points",
            "items": { "type": "string" }
          },
          "fixes": { 
            "type": "array", 
            "description": "3 Short corrected sentences",
            "items": { "type": "string" }
          }
        },
        "required": ["score", "coverage", "structure", "language", "fluency", "strengths", "improvements", "fixes"],
        "additionalProperties": false
      }
    },
    systemPrompt: 'You evaluate speaking summaries. Evaluate the following speaking transcript against the original text and return a JSON with scores and feedback.',
    triggerPrompt: `ORIGINAL TEXT:\n${text.data}\n\n---\nTRANSCRIPT:\n${transcript}`
  });

  const evalPath = path.join(sessionDir, `eval.json`)
  fs.writeFileSync(evalPath, JSON.stringify(evalResult, null, 2))

  await prisma.recapTrainingStats.create({
    data: {
      score: evalResult.score,
      coverage: evalResult.coverage,
      structure: evalResult.structure,
      language: evalResult.language,
      fluency: evalResult.fluency,
    }
  })

  if (Array.isArray(evalResult.improvements) && evalResult.improvements.length) {
    const firstLine = String(evalResult.improvements[0] || '').trim()
    if (firstLine) {
      await prisma.fluencyError.create({
        data: {
          source: 'recap',
          errorType: inferErrorType(firstLine),
          wrongFragment: firstLine,
          suggestedFragment: 'Retell with clearer grammar and structure while preserving key points.'
        }
      })
    }
  }

  try {
    await updateDailyProgress('recap', 'attempt_completed')
  } catch (e) {
    console.error('Daily progress update failed (recap):', e)
  }

  return evalResult;
})
