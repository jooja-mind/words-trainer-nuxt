import { arrayBufferToBase64, resamplePcm16 } from '@/composables/stt/audioUtils'

type ElevenLabsSourceType = 'mic' | 'screen'

type ElevenLabsCloseMeta = {
  code: number
  reason: string
  expected: boolean
}

type ElevenLabsRealtimeCallbacks = {
  onLiveTranscript: (sourceType: ElevenLabsSourceType, text: string) => void
  onFinalTranscript: (sourceType: ElevenLabsSourceType, text: string) => void
  onError: (sourceType: ElevenLabsSourceType, message: string) => void
  onClose: (sourceType: ElevenLabsSourceType, meta: ElevenLabsCloseMeta) => void
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
  sourceType: ElevenLabsSourceType
  credential: string
  sampleRate: number
  languageCode?: string | null
}

type SendAudioParams = {
  sourceType: ElevenLabsSourceType
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
  sourceType: ElevenLabsSourceType,
  payload: ElevenLabsEventPayload,
  callbacks: ElevenLabsRealtimeCallbacks,
) {
  const directError = toStringOrEmpty(payload.error)
  const message = toStringOrEmpty(payload.message)
  const fallbackText = toStringOrEmpty(payload.message_type) || 'ElevenLabs realtime error'
  callbacks.onError(sourceType, directError || message || fallbackText)
}

export function createElevenLabsRealtimeClient(
  callbacks: ElevenLabsRealtimeCallbacks,
  options: ElevenLabsRealtimeOptions = {},
) {
  const connections: Partial<Record<ElevenLabsSourceType, ElevenLabsConnection>> = {}
  const startVersionBySource: Record<ElevenLabsSourceType, number> = {
    mic: 0,
    screen: 0,
  }

  const wsEndpoint = options.wsEndpoint ?? DEFAULT_WS_ENDPOINT
  const modelId = options.modelId ?? DEFAULT_MODEL_ID
  const audioFormat = options.audioFormat ?? DEFAULT_AUDIO_FORMAT
  const commitStrategy = options.commitStrategy ?? DEFAULT_COMMIT_STRATEGY
  const targetSampleRate = Math.max(1, Math.trunc(options.targetSampleRate ?? DEFAULT_TARGET_SAMPLE_RATE))
  const maxBufferedMessages = Math.max(1, options.maxBufferedMessages ?? DEFAULT_MAX_BUFFERED_MESSAGES)

  function clearConnection(sourceType: ElevenLabsSourceType) {
    const connection = connections[sourceType]
    if (!connection) {
      return
    }

    connection.queue.length = 0
    delete connections[sourceType]
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

  function flushQueue(sourceType: ElevenLabsSourceType) {
    const connection = connections[sourceType]
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

  function handleElevenLabsMessage(sourceType: ElevenLabsSourceType, rawPayload: string) {
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
      callbacks.onLiveTranscript(sourceType, partialText)
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
      callbacks.onFinalTranscript(sourceType, finalText)
      return
    }

    if (messageType.includes('error')) {
      emitError(sourceType, payload, callbacks)
    }
  }

  async function start({ sourceType, credential, sampleRate, languageCode }: StartParams) {
    if (connections[sourceType]) {
      return
    }

    startVersionBySource[sourceType] += 1
    const startVersion = startVersionBySource[sourceType]

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

    const connection: ElevenLabsConnection = {
      ws,
      queue: [],
      isStopping: false,
      sourceSampleRate: sampleRate,
    }

    connections[sourceType] = connection

    ws.addEventListener('open', () => {
      const activeConnection = connections[sourceType]
      if (activeConnection !== connection || startVersionBySource[sourceType] !== startVersion) {
        ws.close()
        return
      }
      flushQueue(sourceType)
    })

    ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        return
      }
      handleElevenLabsMessage(sourceType, event.data)
    })

    ws.addEventListener('error', () => {
      if (connection.isStopping) {
        return
      }
      callbacks.onError(sourceType, 'ElevenLabs websocket error')
    })

    ws.addEventListener('close', (event) => {
      const isActiveConnection = connections[sourceType] === connection
      if (isActiveConnection) {
        clearConnection(sourceType)
      }

      callbacks.onClose(sourceType, {
        code: event.code,
        reason: event.reason,
        expected: connection.isStopping || event.code === 1000,
      })
    })
  }

  function sendAudio({ sourceType, b16int }: SendAudioParams) {
    const connection = connections[sourceType]
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

  function stop(sourceType: ElevenLabsSourceType) {
    startVersionBySource[sourceType] += 1

    const connection = connections[sourceType]
    if (!connection) {
      return
    }

    connection.isStopping = true
    connection.queue.length = 0

    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.close(1000, 'Client stop')
      clearConnection(sourceType)
      return
    }

    if (connection.ws.readyState === WebSocket.CONNECTING) {
      connection.ws.close()
    }

    clearConnection(sourceType)
  }

  function stopAll() {
    stop('mic')
    stop('screen')
  }

  return {
    start,
    sendAudio,
    stop,
    stopAll,
  }
}
