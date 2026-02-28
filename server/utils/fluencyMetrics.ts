export function computeFluencyMetrics(input: {
  transcript: string
  timeLimitSec?: number
  timeToFirstWordMs?: number | null
  speechRateWpm?: number | null
  longPauseCount?: number | null
  selfCorrectionCount?: number | null
}) {
  const transcript = String(input.transcript || '').trim()
  const words = transcript ? transcript.split(/\s+/).filter(Boolean) : []

  const timeLimitSec = Number.isFinite(input.timeLimitSec as number) ? Number(input.timeLimitSec) : 30
  const durationMin = Math.max(timeLimitSec / 60, 0.2)

  const speechRateWpm = Number.isFinite(input.speechRateWpm as number)
    ? Number(input.speechRateWpm)
    : Math.round((words.length / durationMin) * 10) / 10

  const longPauseCount = Number.isFinite(input.longPauseCount as number)
    ? Number(input.longPauseCount)
    : (transcript.match(/\.{3,}|\s-\s|\buh\b|\bum\b/gi)?.length || 0)

  const selfCorrectionCount = Number.isFinite(input.selfCorrectionCount as number)
    ? Number(input.selfCorrectionCount)
    : (transcript.match(/\bi mean\b|\bsorry\b|\bno,?\b/gi)?.length || 0)

  const timeToFirstWordMs = Number.isFinite(input.timeToFirstWordMs as number)
    ? Number(input.timeToFirstWordMs)
    : null

  return {
    timeToFirstWordMs,
    speechRateWpm,
    longPauseCount,
    selfCorrectionCount
  }
}
