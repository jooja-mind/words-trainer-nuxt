import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const attempts = await prisma.fluencyAttempt.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200
  })

  const total = attempts.length || 1
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

  const scoreAvg = avg(attempts.map(a => Number(a.score || 0)).filter(Boolean))
  const wpmAvg = avg(attempts.map(a => Number(a.speechRateWpm || 0)).filter(Boolean))
  const pausesAvg = avg(attempts.map(a => Number(a.longPauseCount || 0)).filter(v => Number.isFinite(v)))
  const selfCorrectionsAvg = avg(attempts.map(a => Number(a.selfCorrectionCount || 0)).filter(v => Number.isFinite(v)))

  const acceptableCount = attempts.filter(a => a.verdict === 'acceptable').length

  return {
    summary: {
      attempts: attempts.length,
      acceptableRate: Math.round((acceptableCount / total) * 100),
      scoreAvg: Math.round(scoreAvg * 10) / 10,
      wpmAvg: Math.round(wpmAvg * 10) / 10,
      pausesAvg: Math.round(pausesAvg * 10) / 10,
      selfCorrectionsAvg: Math.round(selfCorrectionsAvg * 10) / 10
    },
    recent: attempts.slice(0, 30)
  }
})
