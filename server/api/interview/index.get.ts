import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const count = await prisma.interviewQA.count()
  if (!count) return { item: null }
  const item = await prisma.interviewQA.findFirst({
    orderBy: {
      timesShown: 'asc'
    }
  });

  await prisma.interviewQA.update({
    where: { id: String(item?.id) },
    data: { timesShown: { increment: 1 } }
  })

  return { item }
})
