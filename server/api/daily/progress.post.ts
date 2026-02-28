import { readBody } from 'h3'
import { updateDailyProgress } from '../../utils/daily'

type ProgressBody = {
  block: 'quiz' | 'recap' | 'interview' | 'fluency' | 'fluency_c'
  event: string
  payload?: Record<string, any>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ProgressBody>(event)
  if (!body?.block) {
    throw createError({ statusCode: 400, statusMessage: 'block is required' })
  }

  const lesson = await updateDailyProgress(body.block, body.event || 'done', body.payload || {})
  return { lesson }
})
