import { prisma } from '../../utils/prisma'
import * as GPT from '../../utils/GPT'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    text: string
  }>(event)

  if (!body?.text?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'text is required' })
  }

  let wordsToAdd = await GPT.ask<{ words: {
    term: string,
    definition: string,
    translationRu: string,
    example: string
  }[] }>({
    systemPrompt: 'You are a helpful assistant who helps present words submitted by the user in a structured order.\nThe user can submit a single word, a word and its definition (in which case, the submitted definition should be used), several words at once, or several words with definitions—the format is free.',
    triggerPrompt: body.text,
    reasoningEffort: 'high',
    jsonSchema: {
      "type": "json_schema",
      "name": "words",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "words": {
            "type": "array",
            "description": "A list of vocabulary words with definitions, Russian translations, and examples.",
            "items": {
              "type": "object",
              "properties": {
                "term": {
                  "type": "string",
                  "description": "The vocabulary word or phrase."
                },
                "definition": {
                  "type": "string",
                  "description": "A definition of the term in English."
                },
                "translationRu": {
                  "type": "string",
                  "description": "Translation of the term into Russian."
                },
                "example": {
                  "type": "string",
                  "description": "Example sentence using the term."
                }
              },
              "required": [
                "term",
                "definition",
                "translationRu",
                "example"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "words"
        ],
        "additionalProperties": false
      }
    }
  });

  if(!wordsToAdd.words || !Array.isArray(wordsToAdd.words) || wordsToAdd.words.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No words found in the text' })
  }

  const createdWords = []
  for(const w of wordsToAdd.words) {
    if(!w.term.trim()) continue;

    let term = w.term?.trim().toLowerCase();

    let foundTerm = await prisma.word.findFirst({ where: { term } })
    if(foundTerm) {
      createdWords.push(foundTerm)
      continue;
    }

    const created = await prisma.word.create({
      data: {
        term: term,
        definition: w.definition?.trim() || null,
        translationRu: w.translationRu?.trim() || null,
        example: w.example?.trim() || null,
        status: 'NEW'
      }
    })

    createdWords.push(created)
  }

  return createdWords;
})
