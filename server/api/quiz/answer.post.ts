import { prisma } from '../../utils/prisma'
import * as wordService from '../../utils/word'

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

  return await wordService.applyAnswerToWord({
    correct,
    wordId: body.wordId
  })
})
