import { readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { updateDailyProgress } from '../../../utils/daily'

type Body = {
  prompt?: string
  options?: string[]
  correctOption?: string
  selectedOption?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  const prompt = String(body?.prompt || '').trim()
  const correctOption = String(body?.correctOption || '').trim()
  const selectedOption = String(body?.selectedOption || '').trim()

  if (!prompt || !correctOption || !selectedOption) {
    throw createError({ statusCode: 400, statusMessage: 'prompt, correctOption, selectedOption are required' })
  }

  const isCorrect = correctOption === selectedOption

  const attempt = await prisma.fluencyAttempt.create({
    data: {
      mode: 'B',
      prompt,
      transcript: selectedOption,
      verdict: isCorrect ? 'acceptable' : 'needs_improvement',
      score: isCorrect ? 100 : 40,
      feedbackJson: {
        correctOption,
        selectedOption,
        options: body?.options || [],
        isCorrect
      }
    }
  })

  if (!isCorrect) {
    await prisma.fluencyError.create({
      data: {
        source: 'fluency',
        errorType: 'WORD_CHOICE',
        wrongFragment: `Selected: ${selectedOption}`,
        suggestedFragment: `Correct: ${correctOption}`
      }
    })
  }

  try {
    await updateDailyProgress('fluency_b', 'item_completed')
  } catch (e) {
    console.error('Daily progress update failed (fluency B):', e)
  }

  return {
    attempt,
    evaluation: {
      verdict: isCorrect ? 'acceptable' : 'needs_improvement',
      score: isCorrect ? 100 : 40,
      feedback: isCorrect ? ['Great. You selected the correct form quickly.'] : [`Correct answer: ${correctOption}`]
    }
  }
})
