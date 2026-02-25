import crypto from 'node:crypto'

type JwtPayload = {
  sub: string
  iat: number
  exp: number
}

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function b64urlJson(obj: unknown) {
  return b64url(JSON.stringify(obj))
}

function fromB64url(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  return Buffer.from(padded, 'base64').toString('utf8')
}

function signHs256(data: string, secret: string) {
  return b64url(crypto.createHmac('sha256', secret).update(data).digest())
}

export function signAuthJwt(secret: string, expiresInSec = 60 * 60 * 24 * 30) {
  const now = Math.floor(Date.now() / 1000)
  const payload: JwtPayload = {
    sub: 'wt_auth',
    iat: now,
    exp: now + expiresInSec
  }

  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = b64urlJson(header)
  const encodedPayload = b64urlJson(payload)
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = signHs256(data, secret)

  return `${data}.${signature}`
}

export function verifyAuthJwt(token: string, secret: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [encodedHeader, encodedPayload, givenSignature] = parts
  const data = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = signHs256(data, secret)

  const a = Buffer.from(givenSignature)
  const b = Buffer.from(expectedSignature)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false

  let header: { alg?: string; typ?: string }
  let payload: Partial<JwtPayload>
  try {
    header = JSON.parse(fromB64url(encodedHeader))
    payload = JSON.parse(fromB64url(encodedPayload))
  } catch {
    return false
  }

  if (header.alg !== 'HS256' || header.typ !== 'JWT') return false
  if (payload.sub !== 'wt_auth') return false
  if (typeof payload.exp !== 'number') return false

  const now = Math.floor(Date.now() / 1000)
  return now < payload.exp
}
