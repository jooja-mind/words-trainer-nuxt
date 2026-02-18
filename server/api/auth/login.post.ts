import { defineEventHandler, readBody, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  const config = useRuntimeConfig()
  const ok = body?.password && config.appPassword && body.password === config.appPassword

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
