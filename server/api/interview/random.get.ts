import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const count = await prisma.interviewQA.count()
  if (!count) return { item: null }
  const skip = Math.floor(Math.random() * count)
  const item = await prisma.interviewQA.findFirst({ skip, select: { id: true, question: true, answer: true } })
  return { item }
})
