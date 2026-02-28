import { prisma } from '../../utils/prisma'

function getUtcDateKey() {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function markAllDone(progress: any) {
  const p = progress || {}
  const blocks = p.blocks || {}

  return {
    started: true,
    completed: true,
    blocks: {
      quiz: {
        answersCompleted: Number(blocks?.quiz?.answersCompleted || 0),
        roundsCompleted: Number(blocks?.quiz?.roundsCompleted || 0),
        done: true
      },
      recap: {
        attempts: Number(blocks?.recap?.attempts || 0),
        done: true
      },
      interview: {
        attempts: Number(blocks?.interview?.attempts || 0),
        acceptable: Boolean(blocks?.interview?.acceptable),
        done: true
      },
      fluency: {
        promptsCompleted: Number(blocks?.fluency?.promptsCompleted || 0),
        done: true
      },
      fluency_c: {
        itemsCompleted: Number(blocks?.fluency_c?.itemsCompleted || 0),
        done: true
      }
    }
  }
}

export default defineEventHandler(async () => {
  const dateKey = getUtcDateKey()
  const lesson = await prisma.dailyLesson.findUnique({ where: { dateKey } })
  if (!lesson) {
    throw createError({ statusCode: 404, statusMessage: 'Daily lesson not found. Call /api/daily/today first.' })
  }

  const updated = await prisma.dailyLesson.update({
    where: { dateKey },
    data: {
      status: 'completed',
      completedAt: new Date(),
      progressJson: markAllDone(lesson.progressJson)
    }
  })

  return { lesson: updated }
})
