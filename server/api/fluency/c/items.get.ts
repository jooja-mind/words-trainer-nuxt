import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const limit = Math.min(Number(getQuery(event).limit || 10), 50)
  const items = await prisma.fluencyError.findMany({
    where: { isResolved: false },
    orderBy: { createdAt: 'desc' },
    take: Number.isFinite(limit) ? limit : 10
  })

  return { items }
})
