import { prisma } from '../../utils/prisma'

function getUtcDateKey() {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default defineEventHandler(async () => {
  const dateKey = getUtcDateKey()

  const lesson = await prisma.dailyLesson.upsert({
    where: { dateKey },
    update: {
      status: 'active',
      startedAt: new Date()
    },
    create: {
      dateKey,
      profile: 'standard',
      status: 'active',
      startedAt: new Date(),
      planJson: {
        timezone: 'UTC',
        profile: 'standard',
        blocks: [
          { id: 'quiz', title: 'Quiz', target: { rounds: 10, wordsPerRound: 5 }, required: true },
          { id: 'recap', title: 'Recap', target: { attempts: 1 }, required: true },
          { id: 'interview', title: 'Interview', target: { acceptable: true, maxAttempts: 3 }, required: true },
          { id: 'fluency', title: 'Fluency', target: { prompts: 10 }, required: true }
        ]
      },
      progressJson: {
        started: true,
        completed: false,
        blocks: {
          quiz: { roundsCompleted: 0, done: false },
          recap: { attempts: 0, done: false },
          interview: { attempts: 0, acceptable: false, done: false },
          fluency: { promptsCompleted: 0, done: false }
        }
      }
    }
  })

  return { lesson }
})
