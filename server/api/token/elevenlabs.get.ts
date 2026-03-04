import { prisma } from '../../utils/prisma'
import axios from 'axios'

export default defineEventHandler(async (event) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if(!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'ELEVENLABS_API_KEY missing' })
  }

  const tokenType = "realtime_scribe";

  const tokenRes = await axios.post<{
    token?: string,
    single_use_token?: string
  }>(
    `https://api.elevenlabs.io/v1/single-use-token/${encodeURIComponent(tokenType)}`,
    {},
    {
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
      }
    }
  )

  if (!tokenRes.data?.token && !tokenRes.data?.single_use_token) {
    throw createError({ statusCode: 502, statusMessage: 'ElevenLabs single-use token request failed', data: tokenRes.data })
  }

  return {
    provider: "elevenlabs",
    token: tokenRes.data.token ?? tokenRes.data.single_use_token ?? null,
  };
})
