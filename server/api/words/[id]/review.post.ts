import { prisma } from '../../../utils/prisma'

const statusMap = {
  good: 'EASY',
  hard: 'HARD',
  later: 'NEW'
} as const

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const body = await readBody<{ result?: 'good' | 'hard' | 'later' }>(event)
  const result = body?.result

  if (!result || !(result in statusMap)) {
    throw createError({ statusCode: 400, statusMessage: 'result must be good|hard|later' })
  }

  const statusAfter = statusMap[result]

  const [word] = await prisma.$transaction([
    prisma.word.update({
      where: { id },
      data: {
        status: statusAfter,
        lastSeenAt: new Date()
      }
    }),
    prisma.wordReview.create({
      data: {
        wordId: id,
        wasCorrect: result === 'good',
        statusAfter
      }
    })
  ])

  return word
})
