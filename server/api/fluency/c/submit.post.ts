import { readBody } from 'h3'
import { prisma } from '../../../utils/prisma'

type Body = {
  id?: string
  isResolved?: boolean
  errorType?: 'ARTICLE' | 'TENSE' | 'VERB_FORM' | 'PREPOSITION' | 'WORD_CHOICE'
  wrongFragment?: string
  suggestedFragment?: string
  source?: 'recap' | 'interview' | 'fluency'
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)

  if (body?.id) {
    const item = await prisma.fluencyError.update({
      where: { id: body.id },
      data: { isResolved: Boolean(body.isResolved) }
    })
    return { item }
  }

  if (!body?.errorType || !body?.wrongFragment || !body?.suggestedFragment) {
    throw createError({ statusCode: 400, statusMessage: 'errorType, wrongFragment, suggestedFragment are required' })
  }

  const item = await prisma.fluencyError.create({
    data: {
      source: body.source || 'fluency',
      errorType: body.errorType,
      wrongFragment: body.wrongFragment,
      suggestedFragment: body.suggestedFragment,
      isResolved: false
    }
  })

  return { item }
})
