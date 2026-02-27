import { readBody } from 'h3'
import { prisma } from '../../utils/prisma'

type ProgressBody = {
  block: 'quiz' | 'recap' | 'interview' | 'fluency'
  event: string
  payload?: Record<string, any>
}

function getUtcDateKey() {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function ensureProgressShape(progress: any) {
  return {
    started: Boolean(progress?.started),
    completed: Boolean(progress?.completed),
    blocks: {
      quiz: { roundsCompleted: Number(progress?.blocks?.quiz?.roundsCompleted || 0), done: Boolean(progress?.blocks?.quiz?.done) },
      recap: { attempts: Number(progress?.blocks?.recap?.attempts || 0), done: Boolean(progress?.blocks?.recap?.done) },
      interview: {
        attempts: Number(progress?.blocks?.interview?.attempts || 0),
        acceptable: Boolean(progress?.blocks?.interview?.acceptable),
        done: Boolean(progress?.blocks?.interview?.done)
      },
      fluency: { promptsCompleted: Number(progress?.blocks?.fluency?.promptsCompleted || 0), done: Boolean(progress?.blocks?.fluency?.done) }
    }
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ProgressBody>(event)
  if (!body?.block) {
    throw createError({ statusCode: 400, statusMessage: 'block is required' })
  }

  const dateKey = getUtcDateKey()
  const lesson = await prisma.dailyLesson.findUnique({ where: { dateKey } })
  if (!lesson) {
    throw createError({ statusCode: 404, statusMessage: 'Daily lesson not found. Call /api/daily/today first.' })
  }

  const progress = ensureProgressShape(lesson.progressJson)
  progress.started = true

  const payload = body.payload || {}

  switch (body.block) {
    case 'quiz': {
      const rounds = Number(payload.roundsCompleted ?? payload.rounds ?? 0)
      if (Number.isFinite(rounds) && rounds > progress.blocks.quiz.roundsCompleted) {
        progress.blocks.quiz.roundsCompleted = rounds
      }
      if (body.event === 'done' || progress.blocks.quiz.roundsCompleted >= 10) {
        progress.blocks.quiz.done = true
      }
      break
    }
    case 'recap': {
      if (body.event === 'attempt_completed') {
        progress.blocks.recap.attempts += 1
      }
      if (body.event === 'done' || progress.blocks.recap.attempts >= 1) {
        progress.blocks.recap.done = true
      }
      break
    }
    case 'interview': {
      if (body.event === 'attempt_completed') {
        progress.blocks.interview.attempts += 1
      }
      if (payload.acceptable === true) {
        progress.blocks.interview.acceptable = true
      }
      if (
        body.event === 'done' ||
        progress.blocks.interview.acceptable === true ||
        progress.blocks.interview.attempts >= 3
      ) {
        progress.blocks.interview.done = true
      }
      break
    }
    case 'fluency': {
      const prompts = Number(payload.promptsCompleted ?? payload.prompts ?? 0)
      if (Number.isFinite(prompts) && prompts > progress.blocks.fluency.promptsCompleted) {
        progress.blocks.fluency.promptsCompleted = prompts
      }
      if (body.event === 'done' || progress.blocks.fluency.promptsCompleted >= 10) {
        progress.blocks.fluency.done = true
      }
      break
    }
  }

  const allDone =
    progress.blocks.quiz.done &&
    progress.blocks.recap.done &&
    progress.blocks.interview.done &&
    progress.blocks.fluency.done

  if (allDone) {
    progress.completed = true
  }

  const updated = await prisma.dailyLesson.update({
    where: { dateKey },
    data: {
      status: allDone ? 'completed' : 'active',
      completedAt: allDone ? new Date() : null,
      progressJson: progress
    }
  })

  return { lesson: updated }
})
