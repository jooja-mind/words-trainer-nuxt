import { defineEventHandler, readBody } from 'h3'
import * as GPT from '../../utils/GPT'

export default defineEventHandler(async (event) => {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })

  const body = await readBody<{ theme?: string }>(event)
  const theme = String(body?.theme || '').trim()

  let triggerPrompt = '';
  if(theme == '' || theme == 'RANDOM'){
    let foundThemes = await prisma.recapTopic.findMany();
    if(foundThemes.length == 0){
      triggerPrompt = 'Write a random story in English, 2 paragraphs, 150-200 words total. Clear and neutral tone, suitable for retelling. Invent specific people, setting, details, and outcome. Avoid cliches and do not reuse a standard storyline.'
    }else{
      let randomTheme = foundThemes[Math.floor(Math.random() * foundThemes.length)]!.text;
      triggerPrompt = `Write a story in English, 2 paragraphs, 150-200 words total. Clear and neutral tone, suitable for retelling. Treat this theme as an open situation rather than a fixed plot: "${randomTheme}". Invent specific people, setting, details, and outcome. Avoid cliches and do not reuse a standard storyline.`;
    }
  }else{
    triggerPrompt = `Write a story in English, 2 paragraphs, 150-200 words total. Clear and neutral tone, suitable for retelling. Treat this theme as an open situation rather than a fixed plot: "${theme}". Invent specific people, setting, details, and outcome. Avoid cliches and do not reuse a standard storyline.`;
  }

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
    triggerPrompt
  })

  return {
    text: result.text
  };
})
