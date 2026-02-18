import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const words = await prisma.word.findMany({
    select: {
      id: true,
      term: true,
      status: true,
      reviews: { select: { wasCorrect: true } }
    }
  })

  const totalWords = words.length
  const totalAnswers = words.reduce((a, w) => a + w.reviews.length, 0)
  const totalWrong = words.reduce((a, w) => a + w.reviews.filter((r) => !r.wasCorrect).length, 0)
  const totalCorrect = totalAnswers - totalWrong

  const toughest = words
    .map((w) => {
      const wrong = w.reviews.filter((r) => !r.wasCorrect).length
      const correct = w.reviews.length - wrong
      return { term: w.term, wrong, correct, kpi: wrong ? correct / wrong : 999 }
    })
    .filter((w) => w.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 5)

  return {
    totalWords,
    totalAnswers,
    totalCorrect,
    totalWrong,
    accuracy: totalAnswers ? totalCorrect / totalAnswers : 0,
    toughest
  }
})
