import { readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import * as GPT from '../../../utils/GPT'
import { updateDailyProgress } from '../../../utils/daily'
import { computeFluencyMetrics } from '../../../utils/fluencyMetrics'

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
  timeLimitSec?: number
  timeToFirstWordMs?: number
  speechRateWpm?: number
  longPauseCount?: number
  selfCorrectionCount?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SubmitBody>(event)
  const prompt = String(body?.prompt || '').trim()
  const transcript = String(body?.transcript || '').trim()

  if (!prompt || !transcript) {
    throw createError({ statusCode: 400, statusMessage: 'prompt and transcript are required' })
  }

  const timeLimitSec = Number.isFinite(body?.timeLimitSec as number) ? Number(body?.timeLimitSec) : 30

  const evaluation = await GPT.ask<{
    verdict: 'acceptable' | 'needs_improvement'
    score: number
    feedback: string[]
  }>({
    model: 'gpt-5.2',
    reasoningEffort: 'medium',
    jsonSchema: {
      type: 'json_schema',
      name: 'FluencyDEvaluation',
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
    systemPrompt: 'You evaluate Pressure Mode speaking answers. Focus on directness, clarity, and natural flow under time pressure. Return JSON only.',
    triggerPrompt: `MODE: Pressure (D)\nTIME_LIMIT_SEC: ${timeLimitSec}\nPROMPT: ${prompt}\nTRANSCRIPT: ${transcript}\n\nScore 0-100 with practical standards, not perfectionism.`
  })

  const metrics = computeFluencyMetrics({
    transcript,
    timeLimitSec,
    timeToFirstWordMs: body?.timeToFirstWordMs,
    speechRateWpm: body?.speechRateWpm,
    longPauseCount: body?.longPauseCount,
    selfCorrectionCount: body?.selfCorrectionCount
  })

  const attempt = await prisma.fluencyAttempt.create({
    data: {
      mode: 'D',
      prompt,
      transcript,
      verdict: evaluation.verdict,
      score: evaluation.score,
      timeToFirstWordMs: metrics.timeToFirstWordMs,
      speechRateWpm: metrics.speechRateWpm,
      longPauseCount: metrics.longPauseCount,
      selfCorrectionCount: metrics.selfCorrectionCount,
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
          suggestedFragment: 'Rephrase the answer with clearer structure and fewer grammar slips.'
        }
      })
    }
  }

  try {
    await updateDailyProgress('fluency', 'prompt_completed')
  } catch (e) {
    console.error('Daily progress update failed (fluency D):', e)
  }

  return { attempt, evaluation }
})
