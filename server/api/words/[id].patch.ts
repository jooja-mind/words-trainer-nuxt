import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const body = await readBody<{
    term?: string
    definition?: string | null
    example?: string | null
    translationRu?: string | null
    status?: 'NEW' | 'HARD' | 'EASY'
  }>(event)

  const updated = await prisma.word.update({
    where: { id },
    data: {
      ...(body.term !== undefined ? { term: body.term.trim() } : {}),
      ...(body.definition !== undefined ? { definition: body.definition || null } : {}),
      ...(body.example !== undefined ? { example: body.example || null } : {}),
      ...(body.translationRu !== undefined ? { translationRu: body.translationRu || null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      lastSeenAt: new Date()
    }
  })

  return updated
})
