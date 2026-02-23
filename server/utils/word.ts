import { prisma } from './prisma'
import * as stats from './stats'

export async function applyAnswerToWord({correct, wordId}: { correct: boolean, wordId: string }) {
  const word = await prisma.word.findUnique({
    where: { id: wordId },
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

  if(!word) {
    throw new Error('Word not found')
  }

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
  ]);

  // get stats
  let currentStats = await stats.get()

  // write stats to WordTrainingStats table
  await prisma.wordTrainingStats.create({
    data: {
      accuracy: currentStats.accuracy,
      totalAnswers: currentStats.totalAnswers,
      totalWords: currentStats.totalWords
    }
  })

  return {
    correct,
    statusAfter,
    correctWordId: word.id,
    prompt: word.term,
    correctDefinition: word.definition
  }
}