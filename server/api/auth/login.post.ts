import { defineEventHandler, readBody, setCookie } from 'h3'
import crypto from 'node:crypto'
import { signAuthJwt } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  const appPassword = process.env.APP_PASSWORD || ''
  const authSecret = process.env.AUTH_SECRET || ''

  if (!appPassword || !authSecret) {
    event.node.res.statusCode = 500
    return { ok: false, error: 'auth_not_configured' }
  }

  const provided = String(body?.password || '')
  const a = Buffer.from(provided)
  const b = Buffer.from(appPassword)
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b)

  if (!ok) {
    event.node.res.statusCode = 401
    return { ok: false }
  }

  const token = signAuthJwt(authSecret, 60 * 60 * 24 * 30)

  setCookie(event, 'wt_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })

  return { ok: true }
})
