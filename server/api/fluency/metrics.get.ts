import { prisma } from '../../utils/prisma'

function dateKeyUTC(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default defineEventHandler(async () => {
  const attempts = await prisma.fluencyAttempt.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300
  })

  const total = attempts.length || 1
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

  const scoreAvg = avg(attempts.map(a => Number(a.score || 0)).filter(Boolean))
  const wpmAvg = avg(attempts.map(a => Number(a.speechRateWpm || 0)).filter(Boolean))
  const pausesAvg = avg(attempts.map(a => Number(a.longPauseCount || 0)).filter(v => Number.isFinite(v)))
  const selfCorrectionsAvg = avg(attempts.map(a => Number(a.selfCorrectionCount || 0)).filter(v => Number.isFinite(v)))

  const acceptableCount = attempts.filter(a => a.verdict === 'acceptable').length

  const now = new Date()
  const keys: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    keys.push(dateKeyUTC(d))
  }

  const byDay = new Map<string, any>(keys.map(k => [k, { date: k, attempts: 0, acceptableRate: 0, scoreAvg: 0, wpmAvg: 0 }]))

  for (const k of keys) {
    const dayItems = attempts.filter(a => dateKeyUTC(new Date(a.createdAt)) === k)
    const t = dayItems.length || 1
    const acceptable = dayItems.filter(a => a.verdict === 'acceptable').length
    byDay.set(k, {
      date: k,
      attempts: dayItems.length,
      acceptableRate: Math.round((acceptable / t) * 100),
      scoreAvg: Math.round(avg(dayItems.map(a => Number(a.score || 0)).filter(Boolean)) * 10) / 10,
      wpmAvg: Math.round(avg(dayItems.map(a => Number(a.speechRateWpm || 0)).filter(Boolean)) * 10) / 10
    })
  }

  return {
    summary: {
      attempts: attempts.length,
      acceptableRate: Math.round((acceptableCount / total) * 100),
      scoreAvg: Math.round(scoreAvg * 10) / 10,
      wpmAvg: Math.round(wpmAvg * 10) / 10,
      pausesAvg: Math.round(pausesAvg * 10) / 10,
      selfCorrectionsAvg: Math.round(selfCorrectionsAvg * 10) / 10
    },
    week: keys.map(k => byDay.get(k)),
    recent: attempts.slice(0, 30)
  }
})
