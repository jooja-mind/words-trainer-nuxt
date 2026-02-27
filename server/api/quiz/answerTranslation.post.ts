import { prisma } from '../../utils/prisma'
import * as wordService from '../../utils/word'
import * as GPT from '../../utils/GPT'
import { updateDailyProgress } from '../../utils/daily'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ wordId: string; translation: string }>(event)
  if (!body?.wordId || !body?.translation) {
    throw createError({ statusCode: 400, statusMessage: 'wordId and translation are required' })
  }

  const word = await prisma.word.findUnique({
    where: { id: body.wordId },
    select: {
      id: true,
      term: true,
      definition: true,
      translation: true,
      reviews: {
        select: { wasCorrect: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 2
      }
    }
  })

  if (!word) {
    throw createError({ statusCode: 404, statusMessage: 'word not found' })
  }

  let LANGUAGE = process.env.LANGUAGE || 'English'
  let NATIVE_LANGUAGE = process.env.NATIVE_LANGUAGE || 'Russian'

  type evaluationResult = {
    isCorrect: boolean,
    confidence: number,
    reasonCode: 'ok' | 'meaning_match' | 'wrong_sense' | 'different_meaning' | 'antonym'
  }

  let evaluation: evaluationResult = {
    isCorrect: false,
    confidence: 0,
    reasonCode: 'ok'
  }

  if((word.translation || '').includes(body.translation)) {
    // quick check for exact match or substring match
    evaluation = {
      isCorrect: true,
      confidence: 1,
      reasonCode: 'ok'
    }
  }else{
    // AI evaluation
    evaluation = await GPT.ask<evaluationResult>({
      systemPrompt: `You are a vocabulary answer grader for language learning.

Direction:
- Source language: ${LANGUAGE}
- Target language: ${NATIVE_LANGUAGE}

Task:
Given a ${LANGUAGE} word (or short phrase), a list of acceptable ${NATIVE_LANGUAGE} meanings, and the user's ${NATIVE_LANGUAGE} answer, decide if the user's answer is acceptable.

Acceptance policy:
- We do NOT require the same grammatical form (noun/verb/adjective/adverb mismatches can still be accepted).
- We accept conceptual translations: the answer can be a nearby concept in the same semantic category IF it still clearly expresses the target idea and would be a fair recall check.
- Accept close synonyms, idioms, and natural paraphrases.

Reject:
- Different concept (only loosely related by topic).
- Opposite meaning.
- Different sense of a polysemous word when the intended meaning is specific.
- Answers that are too generic and could match many unrelated words.

Decision rule:
- Return true only if you would confidently mark it correct for a learning quiz.
- If uncertain, return false.

Never reveal the correct translation(s).`,
    triggerPrompt: `{
  "source_language": "${LANGUAGE}",
  "target_language": "${NATIVE_LANGUAGE}",
  "source_word": "${word.term}",
  "user_answer": "${body.translation}"
}`,
      reasoningEffort: 'medium',
      jsonSchema: {
        "type": "json_schema",
        "name": "Evaluation",
        "strict": true,
        "schema": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "isCorrect": { "type": "boolean" },
            "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
            "reasonCode": {
              "type": "string",
              "enum": [
                "ok",
                "meaning_match",
                "wrong_sense",
                "different_meaning",
                "antonym"
              ],
              "description": "Why the answer was accepted/rejected. Must not reveal correct translations."
            }
          },
          "required": ["isCorrect", "confidence", "reasonCode"]
        }
      }
    })
  }

  console.log('Evaluation result:', evaluation);
  const correct = evaluation.isCorrect;
  
  let result = await wordService.applyAnswerToWord({
    correct,
    wordId: body.wordId
  })

  try {
    await updateDailyProgress('quiz', 'answer_submitted')
  } catch (e) {
    console.error('Daily progress update failed (quiz translation answer):', e)
  }

  return {
    ...result,
    evaluation
  }
})
