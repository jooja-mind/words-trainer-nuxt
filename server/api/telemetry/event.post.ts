import { readBody } from 'h3'
import { prisma } from '../../utils/prisma'

type Body = {
  eventName?: string
  route?: string
  payload?: Record<string, any>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  const eventName = String(body?.eventName || '').trim()
  if (!eventName) {
    throw createError({ statusCode: 400, statusMessage: 'eventName is required' })
  }

  const appEvent = await prisma.appEvent.create({
    data: {
      eventName,
      route: body?.route || null,
      payloadJson: body?.payload || null
    }
  })

  return { ok: true, id: appEvent.id }
})
