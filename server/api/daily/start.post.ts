import { getOrCreateTodayLesson } from '../../utils/daily'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const lesson = await getOrCreateTodayLesson()

  const updated = await prisma.dailyLesson.update({
    where: { dateKey: lesson.dateKey },
    data: {
      status: 'active',
      startedAt: new Date()
    }
  })

  return { lesson: updated }
})
