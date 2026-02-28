import { defineEventHandler, readMultipartFormData } from 'h3'
import { getSTTProvider, transcribeAudio } from '../../utils/stt'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No form data' })

  const audio = form.find((f) => f.name === 'audio')
  if (!audio?.data) throw createError({ statusCode: 400, statusMessage: 'audio is required' })

  try {
    const stt = await transcribeAudio({
      audio: audio.data as Buffer,
      mimeType: audio.type || 'audio/webm',
      language: 'en'
    })

    return {
      provider: getSTTProvider(),
      text: stt.text,
      segments: stt.segments || [],
      words: stt.words || []
    }
  } catch (e: any) {
    console.error('Fluency transcribe failed:', e?.message || e)
    throw createError({ statusCode: 502, statusMessage: String(e?.message || 'Transcription failed') })
  }
})
