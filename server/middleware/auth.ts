import { defineEventHandler, getCookie, sendRedirect, getRequestURL } from 'h3'
import { verifyAuthJwt } from '../utils/jwt'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // allow login + assets + health
  if (path.startsWith('/_nuxt') || path.startsWith('/favicon') || path.startsWith('/robots.txt')) return
  if (path === '/login' || path === '/api/auth/login') return

  const appPassword = process.env.APP_PASSWORD || ''
  const authSecret = process.env.AUTH_SECRET || ''

  // fail-closed if auth is expected but not configured correctly
  if (!appPassword || !authSecret) {
    if (path.startsWith('/api/')) {
      event.node.res.statusCode = 500
      event.node.res.end('Auth misconfigured')
      return
    }
    return sendRedirect(event, '/login')
  }

  const auth = getCookie(event, 'wt_auth')
  if (auth && verifyAuthJwt(auth, authSecret)) return

  // redirect to login for page routes, 401 for API
  if (path.startsWith('/api/')) {
    event.node.res.statusCode = 401
    event.node.res.end('Unauthorized')
    return
  }

  return sendRedirect(event, '/login')
})
