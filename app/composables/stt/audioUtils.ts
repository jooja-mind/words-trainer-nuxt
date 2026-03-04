export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  if (!bytes.length) {
    return ''
  }

  const chunkSize = 0x8000
  let binary = ''

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, Math.min(index + chunkSize, bytes.length))
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export function resamplePcm16(
  sourceBuffer: ArrayBuffer,
  sourceSampleRate: number,
  targetSampleRate: number,
): ArrayBuffer {
  if (sourceBuffer.byteLength === 0) {
    return sourceBuffer.slice(0)
  }

  const normalizedSourceRate = Math.max(1, Math.trunc(sourceSampleRate))
  const normalizedTargetRate = Math.max(1, Math.trunc(targetSampleRate))
  if (normalizedSourceRate === normalizedTargetRate) {
    return sourceBuffer.slice(0)
  }

  const sourceSamples = new Int16Array(sourceBuffer)
  if (sourceSamples.length === 0) {
    return sourceBuffer.slice(0)
  }

  const targetLength = Math.max(
    1,
    Math.round((sourceSamples.length * normalizedTargetRate) / normalizedSourceRate),
  )

  const targetSamples = new Int16Array(targetLength)
  const ratio = normalizedSourceRate / normalizedTargetRate

  for (let targetIndex = 0; targetIndex < targetLength; targetIndex += 1) {
    const sourceIndex = targetIndex * ratio
    const lowerIndex = Math.floor(sourceIndex)
    const upperIndex = Math.min(sourceSamples.length - 1, lowerIndex + 1)
    const weight = sourceIndex - lowerIndex

    const lowerSample = sourceSamples[lowerIndex] ?? 0
    const upperSample = sourceSamples[upperIndex] ?? lowerSample
    targetSamples[targetIndex] = Math.round(lowerSample + (upperSample - lowerSample) * weight)
  }

  return targetSamples.buffer
}
