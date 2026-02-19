import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    term?: string
    definition?: string
    example?: string
    status?: 'NEW' | 'HARD' | 'EASY'
  }>(event)

  if (!body?.term?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'term is required' })
  }

  return prisma.word.create({
    data: {
      term: body.term.trim(),
      definition: body.definition,
      translationRu: body.translationRu?.trim() || null,
      example: body.example?.trim() || null,
      status: body.status ?? 'NEW'
    }
  })
})
