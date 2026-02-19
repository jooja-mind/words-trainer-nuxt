import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ wordId?: string; selectedOptionId?: string; forceWrong?: boolean }>(event)
  if (!body?.wordId || (!body?.selectedOptionId && !body?.forceWrong)) {
    throw createError({ statusCode: 400, statusMessage: 'wordId and selectedOptionId are required' })
  }

  const word = await prisma.word.findUnique({
    where: { id: body.wordId },
    select: {
      id: true,
      term: true,
      definition: true,
      reviews: {
        select: { wasCorrect: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 2
      }
    }
  })

  if (!word) {
    throw createError({ statusCode: 404, statusMessage: 'word not found' })
  }

  const correct = body.forceWrong ? false : (body.selectedOptionId === word.id)
  const previousTwoCorrect = word.reviews.length === 2 && word.reviews.every((r) => r.wasCorrect)

  let statusAfter: 'NEW' | 'HARD' | 'EASY' = 'NEW'
  if (!correct) {
    statusAfter = 'HARD'
  } else if (previousTwoCorrect) {
    statusAfter = 'EASY'
  } else {
    statusAfter = 'NEW'
  }

  await prisma.$transaction([
    prisma.wordReview.create({
      data: {
        wordId: word.id,
        wasCorrect: correct,
        statusAfter
      }
    }),
    prisma.word.update({
      where: { id: word.id },
      data: {
        status: statusAfter,
        lastSeenAt: new Date()
      }
    })
  ])

  return {
    correct,
    statusAfter,
    correctWordId: word.id,
    prompt: word.term,
    correctDefinition: word.definition
  }
})
