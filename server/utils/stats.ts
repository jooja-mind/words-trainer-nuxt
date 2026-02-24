import { prisma } from './prisma'

export async function get(){
  const accuracyWindow = 100

  const words = await prisma.word.findMany({
    select: {
      id: true,
      term: true,
      status: true,
      reviews: { select: { wasCorrect: true } }
    }
  })
  const recentReviews = await prisma.wordReview.findMany({
    select: { wasCorrect: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: accuracyWindow
  })

  const totalWords = words.length
  const totalAnswers = words.reduce((a, w) => a + w.reviews.length, 0)
  const totalWrong = words.reduce((a, w) => a + w.reviews.filter((r) => !r.wasCorrect).length, 0)
  const totalCorrect = totalAnswers - totalWrong
  const totalAnswers100 = recentReviews.length
  const totalCorrect100 = recentReviews.filter((r) => r.wasCorrect).length

  const toughest = words
    .map((w) => {
      const wrong = w.reviews.filter((r) => !r.wasCorrect).length
      const correct = w.reviews.length - wrong
      return { term: w.term, wrong, correct, kpi: wrong ? correct / wrong : 999 }
    })
    .filter((w) => w.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 5)


  const topHardest = words
    .map((w) => {
      const wrong = w.reviews.filter((r) => !r.wasCorrect).length
      const correct = w.reviews.length - wrong
      const kpi = wrong ? correct / wrong : 999
      return { term: w.term, wrong, correct, kpi }
    })
    .filter((w) => w.wrong > 0)
    .sort((a, b) => {
      if (a.kpi !== b.kpi) return a.kpi - b.kpi
      return b.wrong - a.wrong
    })
    .slice(0, 20)

  let accuracyLearningProgress: {i: number, a: number, a100: number}[] = [];
  let wordTrainingStats = await prisma.wordTrainingStats.findMany({
    orderBy: { id: 'desc' },
    take: 1000
  });
  for(let wordTrainingStat of wordTrainingStats){
    accuracyLearningProgress.push({
      i: wordTrainingStat.totalAnswers,
      a: wordTrainingStat.accuracy,
      a100: wordTrainingStat.accuracy100
    })
  }
  accuracyLearningProgress = accuracyLearningProgress.sort((a, b) => a.i - b.i)
  

  return {
    totalWords,
    totalAnswers,
    totalCorrect,
    totalWrong,
    accuracy: totalAnswers ? totalCorrect / totalAnswers : 0,
    accuracy100: totalAnswers100 ? totalCorrect100 / totalAnswers100 : 0,
    accuracy100Answers: totalAnswers100,
    accuracy100Window: accuracyWindow,
    toughest,
    topHardest,
    accuracyLearningProgress
  }
}
