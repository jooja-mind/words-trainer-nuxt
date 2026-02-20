import { defineEventHandler } from 'h3'
import * as GPT from '../../utils/GPT'

export default defineEventHandler(async () => {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })

  let result = await GPT.ask<{ text: string }>({
    model: 'gpt-5.2',
    reasoningEffort: 'high',
    webSearch: true,
    jsonSchema: {
      "type": "json_schema",
      "name": "RetellingText",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "A text for user"
          }
        },
        "required": [
          "text"
        ],
        "additionalProperties": false
      }
    },
    systemPrompt: 'You are a helpful assistant that generates texts for practicing speaking. Output only JSON.',
    triggerPrompt: 'Write a random story in English, 2 paragraphs, 150–200 words total. Clear and neutral tone, suitable for retelling.'
  })

  return {
    text: result.text
  };
})
