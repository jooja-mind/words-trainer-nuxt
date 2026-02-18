import { prisma } from '../../utils/prisma'

type QuizItem = {
  wordId: string
  prompt: string
  options: Array<{ optionId: string; text: string }>
}

function cleanDefinition(raw: string) {
  return raw
    .replace(/^\s*\([^)]*\)\s*[-—:]?\s*/i, '') // leading (noun) -
    .replace(/^\s*(noun|verb|adjective|adverb)\s*[-—:]\s*/i, '')
    .trim()
}

function shuffle<T>(arr: T[]) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limitRaw = Number(query.limit ?? 20)
  const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 20))

  const words = await prisma.word.findMany({
    where: { definition: { not: null } },
    select: {
      id: true,
      term: true,
      definition: true,
      status: true,
      lastSeenAt: true,
      reviews: {
        select: { wasCorrect: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100
      }
    }
  })

  const clean = words.filter((w) => (w.definition ?? '').trim().length > 0)
  if (clean.length < 4) {
    return { questions: [], reason: 'Need at least 4 words with definitions' }
  }

  const now = Date.now()
  const scored = clean.map((w) => {
    const total = w.reviews.length
    const wrong = w.reviews.filter((r) => !r.wasCorrect).length
    const wrongRate = total ? wrong / total : 1

    const daysSince = w.lastSeenAt
      ? (now - new Date(w.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
      : 30

    const stale = Math.min(Math.max(daysSince, 0), 30) / 30
    const rare = 1 / Math.sqrt(Math.max(total, 1))
    const hardBonus = w.status === 'HARD' ? 0.4 : w.status === 'NEW' ? 0.2 : 0

    const priority = wrongRate * 0.55 + stale * 0.25 + rare * 0.15 + hardBonus

    return {
      ...w,
      priority,
      total,
      wrong
    }
  })

  const selected = scored
    .sort((a, b) => b.priority - a.priority)
    .slice(0, Math.min(limit, scored.length))

  const questions: QuizItem[] = selected.map((target) => {
    const distractorPool = scored.filter((w) => w.id !== target.id)
    const distractors = shuffle(distractorPool).slice(0, 3)

    const options = shuffle([
      { optionId: target.id, text: cleanDefinition(target.definition as string) },
      ...distractors.map((d) => ({ optionId: d.id, text: cleanDefinition(d.definition as string) }))
    ])

    return {
      wordId: target.id,
      prompt: target.term,
      options
    }
  })

  return { questions }
})
