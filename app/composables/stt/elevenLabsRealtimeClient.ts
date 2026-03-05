import { arrayBufferToBase64, resamplePcm16 } from '@/composables/stt/audioUtils'

type ElevenLabsCloseMeta = {
  code: number
  reason: string
  expected: boolean
}

type ElevenLabsRealtimeCallbacks = {
  onLiveTranscript: (text: string) => void
  onFinalTranscript: (text: string) => void
  onError: (message: string) => void
  onClose: (meta: ElevenLabsCloseMeta) => void
}

type ElevenLabsCommitStrategy = 'manual' | 'vad'

type ElevenLabsRealtimeOptions = {
  wsEndpoint?: string
  modelId?: string
  audioFormat?: string
  commitStrategy?: ElevenLabsCommitStrategy
  targetSampleRate?: number
  maxBufferedMessages?: number
}

type ElevenLabsConnection = {
  ws: WebSocket
  queue: string[]
  isStopping: boolean
  sourceSampleRate: number
}

type StartParams = {
  credential: string
  sampleRate: number
  languageCode?: string | null
}

type SendAudioParams = {
  b16int: ArrayBuffer
}

type ElevenLabsEventPayload = {
  message_type?: string
  [key: string]: unknown
}

const DEFAULT_WS_ENDPOINT = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime'
const DEFAULT_MODEL_ID = 'scribe_v2_realtime'
const DEFAULT_AUDIO_FORMAT = 'pcm_16000'
const DEFAULT_TARGET_SAMPLE_RATE = 16000
const DEFAULT_COMMIT_STRATEGY: ElevenLabsCommitStrategy = 'vad'
const DEFAULT_MAX_BUFFERED_MESSAGES = 128

function safeJsonParse(rawPayload: string): ElevenLabsEventPayload | null {
  try {
    return JSON.parse(rawPayload) as ElevenLabsEventPayload
  } catch {
    return null
  }
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function emitError(
  payload: ElevenLabsEventPayload,
  callbacks: ElevenLabsRealtimeCallbacks,
) {
  const directError = toStringOrEmpty(payload.error)
  const message = toStringOrEmpty(payload.message)
  const fallbackText = toStringOrEmpty(payload.message_type) || 'ElevenLabs realtime error'
  callbacks.onError(directError || message || fallbackText)
}

export function createElevenLabsRealtimeClient(
  callbacks: ElevenLabsRealtimeCallbacks,
  options: ElevenLabsRealtimeOptions = {},
) {
  let connection: ElevenLabsConnection | null = null
  let startVersion = 0;

  const wsEndpoint = options.wsEndpoint ?? DEFAULT_WS_ENDPOINT
  const modelId = options.modelId ?? DEFAULT_MODEL_ID
  const audioFormat = options.audioFormat ?? DEFAULT_AUDIO_FORMAT
  const commitStrategy = options.commitStrategy ?? DEFAULT_COMMIT_STRATEGY
  const targetSampleRate = Math.max(1, Math.trunc(options.targetSampleRate ?? DEFAULT_TARGET_SAMPLE_RATE))
  const maxBufferedMessages = Math.max(1, options.maxBufferedMessages ?? DEFAULT_MAX_BUFFERED_MESSAGES)

  function clearConnection() {
    if (!connection) return

    connection.queue.length = 0
    connection = null
  }

  function enqueueMessage(connection: ElevenLabsConnection, payload: string) {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(payload)
      return
    }

    if (connection.ws.readyState !== WebSocket.CONNECTING) {
      return
    }

    if (connection.queue.length >= maxBufferedMessages) {
      connection.queue.shift()
    }
    connection.queue.push(payload)
  }

  function flushQueue() {
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return
    }

    while (connection.queue.length > 0) {
      const payload = connection.queue.shift()
      if (!payload) {
        continue
      }
      connection.ws.send(payload)
    }
  }

  function emitMessage(connection: ElevenLabsConnection, payload: Record<string, unknown>) {
    enqueueMessage(connection, JSON.stringify(payload))
  }

  function handleElevenLabsMessage(rawPayload: string) {
    const payload = safeJsonParse(rawPayload)
    if (!payload) {
      return
    }

    const messageType = toStringOrEmpty(payload.message_type ?? payload.type)
    if (!messageType) {
      return
    }

    if (messageType === 'partial_transcript') {
      const partialText = toStringOrEmpty(payload.text) || toStringOrEmpty(payload.transcript)
      if (!partialText) {
        return
      }
      callbacks.onLiveTranscript(partialText)
      return
    }

    if (
      messageType === 'committed_transcript' ||
      messageType === 'committed_transcript_with_timestamps'
    ) {
      const finalText = toStringOrEmpty(payload.text) || toStringOrEmpty(payload.transcript)
      if (!finalText) {
        return
      }
      callbacks.onFinalTranscript(finalText)
      return
    }

    if (messageType.includes('error')) {
      emitError(payload, callbacks)
    }
  }

  async function start({ credential, sampleRate, languageCode }: StartParams) {
    if (!!connection) {
      return
    }

    startVersion += 1

    const wsUrl = new URL(wsEndpoint)
    wsUrl.searchParams.set('token', credential)
    wsUrl.searchParams.set('model_id', modelId)
    wsUrl.searchParams.set('audio_format', audioFormat)
    wsUrl.searchParams.set('commit_strategy', commitStrategy)
    if (languageCode) {
      wsUrl.searchParams.set('language_code', languageCode)
    }
    wsUrl.searchParams.set('min_speech_duration_ms', '750')
    wsUrl.searchParams.set('min_silence_duration_ms', '500')

    const ws = new WebSocket(wsUrl.toString())

    const conn: ElevenLabsConnection = {
      ws,
      queue: [],
      isStopping: false,
      sourceSampleRate: sampleRate,
    }

    connection = conn

    ws.addEventListener('open', () => {
      const activeConnection = connection
      if (activeConnection !== connection || startVersion !== startVersion) {
        ws.close()
        return
      }
      flushQueue()
    })

    ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        return
      }
      handleElevenLabsMessage(event.data)
    })

    ws.addEventListener('error', () => {
      if (connection && connection.isStopping) {
        return
      }
      callbacks.onError('ElevenLabs websocket error')
    })

    ws.addEventListener('close', (event) => {
      const isActiveConnection = connection === conn
      if (isActiveConnection) {
        clearConnection()
      }

      callbacks.onClose({
        code: event.code,
        reason: event.reason,
        expected: conn.isStopping || event.code === 1000,
      })
    })
  }

  function sendAudio({ b16int }: SendAudioParams) {
    if (!connection) {
      return
    }

    const normalizedPcm = resamplePcm16(
      b16int,
      connection.sourceSampleRate,
      targetSampleRate,
    )
    if (!normalizedPcm.byteLength) {
      return
    }

    emitMessage(connection, {
      message_type: 'input_audio_chunk',
      audio_base_64: arrayBufferToBase64(normalizedPcm),
      sample_rate: targetSampleRate,
    })
  }

  function stop() {
    startVersion += 1

    if (!connection) {
      return
    }

    connection.isStopping = true
    connection.queue.length = 0

    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.close(1000, 'Client stop')
      clearConnection()
      return
    }

    if (connection.ws.readyState === WebSocket.CONNECTING) {
      connection.ws.close()
    }

    clearConnection()
  }

  function stopAll() {
    stop()
  }

  return {
    start,
    sendAudio,
    stop,
    stopAll,
  }
}
