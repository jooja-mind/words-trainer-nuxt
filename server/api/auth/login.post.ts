import { defineEventHandler, readBody, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  const appPassword = process.env.APP_PASSWORD || ''
  const ok = body?.password && appPassword && body.password === appPassword

  if (!ok) {
    event.node.res.statusCode = 401
    return { ok: false }
  }

  setCookie(event, 'wt_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })

  return { ok: true }
})
