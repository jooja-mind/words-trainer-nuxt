import { defineEventHandler, getCookie, sendRedirect, getRequestURL } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // allow login + assets + health
  if (path.startsWith('/_nuxt') || path.startsWith('/favicon') || path.startsWith('/robots.txt')) return
  if (path === '/login' || path === '/api/auth/login') return

  const auth = getCookie(event, 'wt_auth')
  if (auth === '1') return

  // redirect to login for page routes, 401 for API
  if (path.startsWith('/api/')) {
    event.node.res.statusCode = 401
    event.node.res.end('Unauthorized')
    return
  }

  return sendRedirect(event, '/login')
})
