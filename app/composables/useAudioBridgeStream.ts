import { onMounted, onUnmounted, ref } from 'vue'
import MicrophoneStream from 'microphone-stream'

type UseAudioBridgeStreamOptions = {
  shouldBridge: () => boolean
  onAudioBridge: (b16int: ArrayBuffer) => void
  onRecognitionStart: (sampleRate: number) => void
  onRecognitionStop: () => void,
  selectedInputDevice: Ref<string>
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

export function useAudioBridgeStream(
  options: UseAudioBridgeStreamOptions,
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

    options.onRecognitionStart(activeSampleRate)
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
    options.onRecognitionStart(activeSampleRate)

    if (!navigator.onLine) {
      shouldResumeAfterReconnect = true
    }

    const streamWithEvents = micStream as unknown as {
      on: (eventName: string, listener: (chunk: unknown) => void) => void
    }

    streamWithEvents.on('data', (chunk) => {
      if(muted.value) return;
      const raw = MicrophoneStream.toRaw(chunk as never)

      vol.value = raw.filter((value) => value >= 0).reduce((acc, value) => acc + value, 0)

      if (!isSoundDetected.value && vol.value > 1) {
        isSoundDetected.value = true
      }

      console.log(options.shouldBridge(), raw.length)
      if (options.shouldBridge()) {
        options.onAudioBridge(convertFloat32ToInt16(raw))
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
      options.onRecognitionStop()
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

  let muted = ref(false);
  function mute(){
    muted.value = true;
    setTimeout(() => {
      vol.value = 0;
    }, 100);
  }
  function unmute(){
    muted.value = false;
    if(isActive.value) options.onRecognitionStart(activeSampleRate)
  }

  async function startMicRecorder() {
    try {
      const stream = await getUserMediaForSelectedInputDevice()
      bindStream(stream)
    } catch (error) {
      console.log(error)
    }
  }

  async function getUserMediaForSelectedInputDevice() {
    if (!options.selectedInputDevice.value) {
      return navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      })
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          deviceId: { exact: options.selectedInputDevice.value },
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
    } catch (error) {
      const isDeviceUnavailableError =
        error instanceof DOMException &&
        (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')

      if (!isDeviceUnavailableError) {
        throw error
      }

      return navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      })
    }
  }

  return {
    vol,
    isSoundDetected,
    isActive,
    bindStream,
    stop,
    muted,
    mute,
    unmute,
    startMicRecorder
  }
}
