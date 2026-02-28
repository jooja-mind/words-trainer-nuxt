import { readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import * as GPT from '../../../utils/GPT'
import { updateDailyProgress } from '../../../utils/daily'

function inferErrorType(line: string): 'ARTICLE' | 'TENSE' | 'VERB_FORM' | 'PREPOSITION' | 'WORD_CHOICE' {
  const t = line.toLowerCase()
  if (t.includes('article')) return 'ARTICLE'
  if (t.includes('tense') || t.includes('past') || t.includes('present') || t.includes('perfect')) return 'TENSE'
  if (t.includes('verb')) return 'VERB_FORM'
  if (t.includes('preposition')) return 'PREPOSITION'
  return 'WORD_CHOICE'
}

type SubmitBody = {
  prompt?: string
  transcript?: string
  targetPattern?: string
  timeToFirstWordMs?: number
  speechRateWpm?: number
  longPauseCount?: number
  selfCorrectionCount?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SubmitBody>(event)
  const prompt = String(body?.prompt || '').trim()
  const transcript = String(body?.transcript || '').trim()
  const targetPattern = String(body?.targetPattern || '').trim()

  if (!prompt || !transcript) {
    throw createError({ statusCode: 400, statusMessage: 'prompt and transcript are required' })
  }

  const evaluation = await GPT.ask<{
    verdict: 'acceptable' | 'needs_improvement'
    score: number
    feedback: string[]
  }>({
    model: 'gpt-5.2',
    reasoningEffort: 'medium',
    jsonSchema: {
      type: 'json_schema',
      name: 'FluencyAEvaluation',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          verdict: { type: 'string', enum: ['acceptable', 'needs_improvement'] },
          score: { type: 'number' },
          feedback: { type: 'array', items: { type: 'string' } }
        },
        required: ['verdict', 'score', 'feedback'],
        additionalProperties: false
      }
    },
    systemPrompt: 'You evaluate Fluency Pattern Drill answers. Focus on grammar pattern usage, clarity, and natural spoken flow. Return JSON only.',
    triggerPrompt: `MODE: Pattern Drills (A)\nTARGET_PATTERN: ${targetPattern || 'not_specified'}\nPROMPT: ${prompt}\nTRANSCRIPT: ${transcript}\n\nScore 0-100. If core intent and pattern usage are sufficient, verdict acceptable.`
  })

  const attempt = await prisma.fluencyAttempt.create({
    data: {
      mode: 'A',
      prompt,
      targetPattern: targetPattern || null,
      transcript,
      verdict: evaluation.verdict,
      score: evaluation.score,
      timeToFirstWordMs: Number.isFinite(body?.timeToFirstWordMs as number) ? Number(body?.timeToFirstWordMs) : null,
      speechRateWpm: Number.isFinite(body?.speechRateWpm as number) ? Number(body?.speechRateWpm) : null,
      longPauseCount: Number.isFinite(body?.longPauseCount as number) ? Number(body?.longPauseCount) : null,
      selfCorrectionCount: Number.isFinite(body?.selfCorrectionCount as number) ? Number(body?.selfCorrectionCount) : null,
      feedbackJson: evaluation
    }
  })

  if (evaluation.verdict === 'needs_improvement' && evaluation.feedback?.length) {
    const firstLine = String(evaluation.feedback[0] || '').trim()
    if (firstLine) {
      await prisma.fluencyError.create({
        data: {
          source: 'fluency',
          errorType: inferErrorType(firstLine),
          wrongFragment: firstLine,
          suggestedFragment: 'Rephrase the answer with correct grammar and clearer structure.'
        }
      })
    }
  }

  try {
    await updateDailyProgress('fluency', 'prompt_completed')
  } catch (e) {
    console.error('Daily progress update failed (fluency A):', e)
  }

  return { attempt, evaluation }
})
