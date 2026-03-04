import { Buffer } from 'buffer'
import processPolyfill from 'process'

export default defineNuxtPlugin(() => {
  const g = globalThis as any

  g.Buffer = g.Buffer ?? Buffer
  g.process = g.process ?? processPolyfill

  if (typeof g.process.nextTick !== 'function') {
    g.process.nextTick = (cb: (...args: any[]) => void, ...args: any[]) => {
      queueMicrotask(() => cb(...args))
    }
  }
})
