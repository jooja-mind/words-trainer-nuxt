import { readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import * as GPT from '../../../utils/GPT'
import { updateDailyProgress } from '../../../utils/daily'

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

  const attempt = await prisma.fluencyAttempt.create({
    data: {
      mode: 'D',
      prompt,
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

  try {
    await updateDailyProgress('fluency', 'prompt_completed')
  } catch (e) {
    console.error('Daily progress update failed (fluency D):', e)
  }

  return { attempt, evaluation }
})
