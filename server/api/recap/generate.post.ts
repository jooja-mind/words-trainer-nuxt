import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })

  const prompt = `Write a random topic text in English, 2 paragraphs, 150–200 words total. Clear and neutral tone, suitable for retelling.`

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: 'You generate short reading passages for speaking practice.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8
    })
  })
  const data = await r.json()
  const text = data?.choices?.[0]?.message?.content?.trim() || ''
  return { text }
})
