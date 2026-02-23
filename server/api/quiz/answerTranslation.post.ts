import { prisma } from '../../utils/prisma'
import * as wordService from '../../utils/word'
import * as GPT from '../../utils/GPT'

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

  let evaluation = await GPT.ask<{
    isCorrect: boolean,
  }>({
    systemPrompt: `You are a vocabulary answer grader for language learning.

Direction:
- Source language: ${LANGUAGE}
- Target language: ${NATIVE_LANGUAGE}

Task:
Given an ${LANGUAGE} word (or short phrase), a list of acceptable ${NATIVE_LANGUAGE} meanings, and the user's ${NATIVE_LANGUAGE} answer, decide if the user's answer is acceptable.

Rules:
- Accept close synonyms and natural ${NATIVE_LANGUAGE} paraphrases that preserve the meaning.
- Accept minor typos if it is clearly the same word.
- Reject:
  - different meaning or different sense (polysemy mismatch),
  - antonyms,
  - too vague answers compared to the target meaning,
  - only topic-related words (not meaning-related).
- If unsure, return false.
- Never reveal the correct translation(s) in any form.`,
    triggerPrompt: `{
  "source_language": "${LANGUAGE}",
  "target_language": "${NATIVE_LANGUAGE}",
  "source_word": "${word.term}",
  "expected_meanings": ${word.translation || '(decide on your own)'},
  "user_answer": "${body.translation}"
}`,
    reasoningEffort: 'medium',
    jsonSchema: {
      "type": "json_schema",
      "name": "Evaluation",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "isCorrect": {
            "type": "boolean",
            "description": "Whether the user's answer is correct."
          }
        },
        "required": [
          "isCorrect"
        ],
        "additionalProperties": false
      }
    }
  })

  console.log('Evaluation result:', evaluation);
  const correct = evaluation.isCorrect;
  
  return await wordService.applyAnswerToWord({
    correct,
    wordId: body.wordId
  })
})
