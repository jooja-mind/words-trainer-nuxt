import { prisma } from '../../utils/prisma'

function cleanDefinition(raw: string) {
  return raw
    .replace(/^\s*\([^)]*\)\s*[-—:]?\s*/i, '')
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
  const limitRaw = Number(query.limit ?? 50)
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50))
  const windowN = Number(process.env.MARATHON_WINDOW || 15)

  const words = await prisma.word.findMany({
    where: { definition: { not: null } },
    select: {
      id: true,
      term: true,
      definition: true,
      translation: true,
      reviews: {
        select: { wasCorrect: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: Math.max(windowN, 1)
      }
    }
  })

  const pool = words
    .map((w) => {
      const total = w.reviews.length
      const wrong = w.reviews.filter((r) => !r.wasCorrect).length
      const correct = total - wrong
      const kpi = wrong ? correct / wrong : 999
      return { ...w, total, wrong, kpi }
    })
    // include only if any wrong in last N answers
    .filter((w) => w.reviews.some(r => !r.wasCorrect))
    .sort((a, b) => {
      if (a.kpi !== b.kpi) return a.kpi - b.kpi
      return b.wrong - a.wrong
    })

  if (pool.length < 4) {
    return { questions: [], reason: `Need at least 4 problematic words in last ${windowN} answers` }
  }

  const selected = pool.slice(0, Math.min(limit, pool.length))
  const questions = selected.map((target) => {
    const distractorPool = words.filter((w) => w.id !== target.id)
    const distractors = shuffle(distractorPool).slice(0, 3)
    const options = shuffle([
      { optionId: target.id, text: cleanDefinition(target.definition as string), translation: target.translation || '' },
      ...distractors.map((d) => ({ optionId: d.id, text: cleanDefinition(d.definition as string), translation: d.translation || '' }))
    ])

    return {
      wordId: target.id,
      prompt: target.term,
      translation: target.translation ?? null,
      options
    }
  })

  return { questions }
})
