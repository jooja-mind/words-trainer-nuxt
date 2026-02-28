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

function nextIntervalDays(reviewCount: number) {
  if (reviewCount <= 1) return 1
  if (reviewCount === 2) return 3
  return 7
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)

  if (body?.id) {
    const current = await prisma.fluencyError.findUnique({ where: { id: body.id } })
    if (!current) throw createError({ statusCode: 404, statusMessage: 'FluencyError not found' })

    const willResolve = Boolean(body.isResolved)
    const nextReviewCount = willResolve ? (current.reviewCount + 1) : current.reviewCount
    const intervalDays = nextIntervalDays(nextReviewCount)
    const nextReviewAt = willResolve
      ? new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000)
      : null

    const item = await prisma.fluencyError.update({
      where: { id: body.id },
      data: {
        isResolved: willResolve,
        reviewCount: nextReviewCount,
        lastReviewedAt: willResolve ? new Date() : current.lastReviewedAt,
        nextReviewAt
      }
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
      isResolved: false,
      reviewCount: 0,
      nextReviewAt: null
    }
  })

  return { item }
})
