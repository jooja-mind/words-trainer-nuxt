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
    confidence: number,
    reasonCode: 'meaning_match' | 'near_synonym' | 'typo_ok' | 'wrong_sense' | 'different_meaning' | 'antonym' | 'too_vague' | 'topic_related' | 'form_mismatch'
  }>({
    systemPrompt: `You are a vocabulary answer grader for language learning.

Direction:
- Source language: ${LANGUAGE}
- Target language: ${NATIVE_LANGUAGE}

Task:
Given a ${LANGUAGE} word (or short phrase), a list of acceptable ${NATIVE_LANGUAGE} meanings, and the user's ${NATIVE_LANGUAGE} answer, decide if the user's answer is acceptable.

Rules:
- Accept close synonyms and natural ${NATIVE_LANGUAGE} paraphrases that preserve the meaning.
- Accept idiomatic expressions in ${NATIVE_LANGUAGE} if they convey the same meaning (e.g. an idiom can be correct for an adverb).
- Accept minor typos if it is clearly the same word/phrase.
- Do not reject an idiom just because it is multi-word if it matches the part of speech functionally (adverbial meaning).
- Reject:
  - different meaning or different sense (polysemy mismatch),
  - antonyms,
  - too vague answers compared to the target meaning,
  - only topic-related words (not meaning-related).
- Decision policy:
  - Return true if the user's answer matches the meaning well enough for a learning quiz.
  - If unsure, return false.
- Never reveal the correct translation(s) in any form.`,
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
              "meaning_match",
              "near_synonym",
              "typo_ok",
              "wrong_sense",
              "different_meaning",
              "antonym",
              "too_vague",
              "topic_related",
              "form_mismatch"
            ],
            "description": "Why the answer was accepted/rejected. Must not reveal correct translations."
          }
        },
        "required": ["isCorrect", "confidence", "reasonCode"]
      }
    }
  })

  console.log('Evaluation result:', evaluation);
  const correct = evaluation.isCorrect;
  
  let result = await wordService.applyAnswerToWord({
    correct,
    wordId: body.wordId
  })

  return {
    ...result,
    evaluation
  }
})
