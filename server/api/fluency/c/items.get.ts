import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const limit = Math.min(Number(getQuery(event).limit || 10), 50)
  const now = new Date()

  const unresolved = await prisma.fluencyError.findMany({
    where: { isResolved: false },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  const remaining = Math.max(0, limit - unresolved.length)
  const due = remaining > 0
    ? await prisma.fluencyError.findMany({
        where: {
          isResolved: true,
          nextReviewAt: { lte: now }
        },
        orderBy: { nextReviewAt: 'asc' },
        take: remaining
      })
    : []

  return { items: [...unresolved, ...due] }
})
