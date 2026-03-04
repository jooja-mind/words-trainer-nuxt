import { onMounted, onUnmounted, ref } from 'vue'
import MicrophoneStream from 'microphone-stream'

export type SourceType = 'mic' | 'screen'

type UseAudioBridgeStreamOptions<TSource extends SourceType> = {
  sourceType: TSource
  shouldBridge: () => boolean
  onAudioBridge: (b16int: ArrayBuffer, sourceType: TSource) => void
  onRecognitionStart: (sourceType: TSource, sampleRate: number) => void
  onRecognitionStop: (sourceType: TSource) => void
}

type StopOptions = {
  stopTracks?: boolean
  emitStop?: boolean
}

function convertFloat32ToInt16(buffer: Float32Array): ArrayBuffer {
  let index = buffer.length
  const converted = new Int16Array(index)

  while (index--) {
    converted[index] = Math.min(1, buffer[index] ?? 0) * 0x7fff
  }

  return converted.buffer
}

export function useAudioBridgeStream<TSource extends SourceType>(
  options: UseAudioBridgeStreamOptions<TSource>,
) {
  const vol = ref(0)
  const isSoundDetected = ref(false)
  const isActive = ref(false)

  let micStream: MicrophoneStream | null = null
  let sourceStream: MediaStream | null = null
  let activeSampleRate = 16000
  let shouldResumeAfterReconnect = false

  function markReconnectNeeded() {
    if (!isActive.value) {
      return
    }

    shouldResumeAfterReconnect = true
  }

  function resumeRecognitionAfterReconnect() {
    if (!shouldResumeAfterReconnect) {
      return
    }

    if (!isActive.value) {
      shouldResumeAfterReconnect = false
      return
    }

    if (options.shouldBridge()) {
      shouldResumeAfterReconnect = false
      return
    }

    options.onRecognitionStart(options.sourceType, activeSampleRate)
    shouldResumeAfterReconnect = false
  }

  function bindStream(stream: MediaStream) {
    if (micStream || sourceStream) {
      stop({ stopTracks: true, emitStop: false })
    }

    sourceStream = stream
    isActive.value = true
    micStream = new MicrophoneStream({
      objectMode: false,
    })

    const streamTrackSampleRate = stream.getAudioTracks()[0]?.getSettings().sampleRate
    const contextSampleRate = micStream.context.sampleRate
    const sampleRate = Math.round(contextSampleRate || streamTrackSampleRate || 16000)
    activeSampleRate = sampleRate

    micStream.setStream(stream)
    options.onRecognitionStart(options.sourceType, sampleRate)

    if (!navigator.onLine) {
      shouldResumeAfterReconnect = true
    }

    const streamWithEvents = micStream as unknown as {
      on: (eventName: string, listener: (chunk: unknown) => void) => void
    }

    streamWithEvents.on('data', (chunk) => {
      const raw = MicrophoneStream.toRaw(chunk as never)

      vol.value = raw.filter((value) => value >= 0).reduce((acc, value) => acc + value, 0)

      if (!isSoundDetected.value && vol.value > 1) {
        isSoundDetected.value = true
      }

      if (options.shouldBridge()) {
        options.onAudioBridge(convertFloat32ToInt16(raw), options.sourceType)
      }
    })
  }

  function stop({ stopTracks = false, emitStop = true }: StopOptions = {}) {
    const hadActiveStream = Boolean(micStream || sourceStream)

    if (micStream) {
      micStream.stop()
      micStream = null
    }

    if (stopTracks && sourceStream) {
      sourceStream.getTracks().forEach((track) => track.stop())
    }

    sourceStream = null
    shouldResumeAfterReconnect = false
    vol.value = 0
    isSoundDetected.value = false
    isActive.value = false

    if (emitStop && hadActiveStream) {
      options.onRecognitionStop(options.sourceType)
    }
  }

  onMounted(() => {
    window.addEventListener('offline', markReconnectNeeded)
    window.addEventListener('online', resumeRecognitionAfterReconnect)
  })

  onUnmounted(() => {
    window.removeEventListener('offline', markReconnectNeeded)
    window.removeEventListener('online', resumeRecognitionAfterReconnect)
  })

  return {
    vol,
    isSoundDetected,
    isActive,
    bindStream,
    stop,
  }
}
