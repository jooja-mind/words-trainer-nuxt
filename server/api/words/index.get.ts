import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : undefined

  const where = status && ['NEW', 'HARD', 'EASY'].includes(status)
    ? { status: status as 'NEW' | 'HARD' | 'EASY' }
    : undefined

  return prisma.word.findMany({
    where,
    orderBy: [
      { status: 'asc' },
      { updatedAt: 'desc' }
    ]
  })
})
