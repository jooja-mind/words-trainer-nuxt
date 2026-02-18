import { defineEventHandler, setCookie } from 'h3'

export default defineEventHandler((event) => {
  setCookie(event, 'wt_auth', '', { path: '/', maxAge: 0 })
  return { ok: true }
})
