import { createElevenLabsRealtimeClient } from '@/composables/stt/elevenLabsRealtimeClient'

type STTProviderErrorPayload = {
  message: string
}

type STTBridgeStartPayload = {
  token: string
  tokenExpiresAt: number | null
  sampleRate: number
}

type STTBridgeStopPayload = {
  token?: string
  tokenExpiresAt: number | null
  sampleRate: number
}

type STTBridgeAudioPayload = {
  b16int: ArrayBuffer
}

export type STTTokenWorkerProbeResult = {
  tokenExpiresAt: number | null
}

export type STTProviderLanguageOption = {
  value: string
  label: string
}

export type STTProvider = {
  label: string
  languageOptions: readonly STTProviderLanguageOption[]
  defaultLanguage: string
}

type STTSourceState = {
  recognition: boolean
  liveText: string
  finalText: string
  sampleRate: number
  history: HistoryEntry[]
  liveTextStartedAt: number
}

export type STTState = {
  error: string | null
} & STTSourceState;

type OpenAIRealtimeSession = Record<string, unknown>

type UseSTTOptions = {
  defaultProvider?: string
  assemblyTokenTtlSeconds?: number
  openAITokenTtlSeconds?: number
  openAISession?: OpenAIRealtimeSession
  openAIRealtimeModel?: string
  openAITranscriptionModel?: string
  openAITargetSampleRate?: number
  elevenLabsTokenType?: string
  elevenLabsModelId?: string
  elevenLabsAudioFormat?: string
  elevenLabsTargetSampleRate?: number
  elevenLabsCommitStrategy?: 'manual' | 'vad'
  maxPendingAudioChunks?: number
  onBridgeStart?: (payload: STTBridgeStartPayload) => void
  onBridgeStop?: (payload: STTBridgeStopPayload) => void
  onBridgeAudio?: (payload: STTBridgeAudioPayload) => void
  onProviderError?: (payload: STTProviderErrorPayload) => void
  onFinalTranscript?: (finalizedObject: HistoryEntry) => void
}

export type HistoryEntry = {
  timestampStart: number
  timestampEnd: number
  text: string
}

const ELEVENLABS_LANGUAGE_OPTIONS = Object.freeze([
  { value: 'auto', label: 'Auto-detect' },
  { value: 'afr', label: 'Afrikaans' },
  { value: 'amh', label: 'Amharic' },
  { value: 'ara', label: 'Arabic' },
  { value: 'asm', label: 'Assamese' },
  { value: 'ast', label: 'Asturian' },
  { value: 'aze', label: 'Azerbaijani' },
  { value: 'bel', label: 'Belarusian' },
  { value: 'ben', label: 'Bengali' },
  { value: 'bos', label: 'Bosnian' },
  { value: 'bre', label: 'Breton' },
  { value: 'bul', label: 'Bulgarian' },
  { value: 'cat', label: 'Catalan' },
  { value: 'ceb', label: 'Cebuano' },
  { value: 'ces', label: 'Czech' },
  { value: 'cmn', label: 'Chinese (Mandarin)' },
  { value: 'cym', label: 'Welsh' },
  { value: 'dan', label: 'Danish' },
  { value: 'deu', label: 'German' },
  { value: 'ell', label: 'Greek' },
  { value: 'eng', label: 'English' },
  { value: 'est', label: 'Estonian' },
  { value: 'eus', label: 'Basque' },
  { value: 'fas', label: 'Persian' },
  { value: 'fin', label: 'Finnish' },
  { value: 'fra', label: 'French' },
  { value: 'glg', label: 'Galician' },
  { value: 'guj', label: 'Gujarati' },
  { value: 'hau', label: 'Hausa' },
  { value: 'haw', label: 'Hawaiian' },
  { value: 'heb', label: 'Hebrew' },
  { value: 'hin', label: 'Hindi' },
  { value: 'hrv', label: 'Croatian' },
  { value: 'hun', label: 'Hungarian' },
  { value: 'hye', label: 'Armenian' },
  { value: 'ibo', label: 'Igbo' },
  { value: 'ind', label: 'Indonesian' },
  { value: 'isl', label: 'Icelandic' },
  { value: 'ita', label: 'Italian' },
  { value: 'jav', label: 'Javanese' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'kan', label: 'Kannada' },
  { value: 'kat', label: 'Georgian' },
  { value: 'kaz', label: 'Kazakh' },
  { value: 'khm', label: 'Khmer' },
  { value: 'kor', label: 'Korean' },
  { value: 'lao', label: 'Lao' },
  { value: 'lin', label: 'Lingala' },
  { value: 'lit', label: 'Lithuanian' },
  { value: 'ltz', label: 'Luxembourgish' },
  { value: 'lug', label: 'Luganda' },
  { value: 'lav', label: 'Latvian' },
  { value: 'mal', label: 'Malayalam' },
  { value: 'mar', label: 'Marathi' },
  { value: 'mkd', label: 'Macedonian' },
  { value: 'mlt', label: 'Maltese' },
  { value: 'mri', label: 'Maori' },
  { value: 'msa', label: 'Malay' },
  { value: 'mya', label: 'Burmese' },
  { value: 'nld', label: 'Dutch' },
  { value: 'nno', label: 'Norwegian Nynorsk' },
  { value: 'nob', label: 'Norwegian Bokmal' },
  { value: 'nor', label: 'Norwegian' },
  { value: 'nya', label: 'Nyanja' },
  { value: 'oci', label: 'Occitan' },
  { value: 'orm', label: 'Oromo' },
  { value: 'pan', label: 'Punjabi' },
  { value: 'pol', label: 'Polish' },
  { value: 'por', label: 'Portuguese' },
  { value: 'pus', label: 'Pashto' },
  { value: 'ron', label: 'Romanian' },
  { value: 'run', label: 'Rundi' },
  { value: 'rus', label: 'Russian' },
  { value: 'sin', label: 'Sinhala' },
  { value: 'slk', label: 'Slovak' },
  { value: 'slv', label: 'Slovenian' },
  { value: 'sna', label: 'Shona' },
  { value: 'som', label: 'Somali' },
  { value: 'spa', label: 'Spanish' },
  { value: 'srp', label: 'Serbian' },
  { value: 'swe', label: 'Swedish' },
  { value: 'swa', label: 'Swahili' },
  { value: 'tam', label: 'Tamil' },
  { value: 'tel', label: 'Telugu' },
  { value: 'tgk', label: 'Tajik' },
  { value: 'tha', label: 'Thai' },
  { value: 'tur', label: 'Turkish' },
  { value: 'ukr', label: 'Ukrainian' },
  { value: 'umb', label: 'Umbundu' },
  { value: 'urd', label: 'Urdu' },
  { value: 'uzb', label: 'Uzbek' },
  { value: 'vie', label: 'Vietnamese' },
  { value: 'yor', label: 'Yoruba' },
  { value: 'zul', label: 'Zulu' },
]) as readonly STTProviderLanguageOption[]

const STT_PROVIDERS: readonly STTProvider[] = Object.freeze([
  {
    id: 'elevenlabs',
    label: 'ElevenLabs',
    supportedSources: ['mic', 'screen'],
    languageOptions: ELEVENLABS_LANGUAGE_OPTIONS,
    defaultLanguage: 'auto',
  },
])

const DEFAULT_SAMPLE_RATE = 16000
const DEFAULT_ELEVENLABS_TOKEN_TYPE = 'realtime_scribe'
const DEFAULT_MAX_PENDING_AUDIO_CHUNKS = 64

type TemporaryProviderToken = {
  value: string
  expiresAt: number | null
}


export function useSTT(options: UseSTTOptions = {}) {
  let startVersion = 0;

  let sourceReady = false;

  const pendingAudioChunks = [] as ArrayBuffer[]

  let activeBridgeToken: TemporaryProviderToken | null = null
  const maxPendingAudioChunks = Math.max(1, options.maxPendingAudioChunks ?? DEFAULT_MAX_PENDING_AUDIO_CHUNKS)

  const state = reactive<STTState>({
    error: null,
    recognition: false,
    liveText: '',
    liveTextStartedAt: 0,
    finalText: '',
    sampleRate: DEFAULT_SAMPLE_RATE,
    history: [],
  })

  function reportError(message: string) {
    state.error = message
    options.onProviderError?.({
      message,
    })
  }

  function clearError() {
    state.error = null
  }

  function setLiveTranscript(text: string) {
    if(!state.liveText && !!text) {
      state.liveTextStartedAt = Date.now()
    }
    state.liveText = text
  }

  function appendFinalTranscript(text: string) {
    state.finalText = `${state.finalText} ${text}`.trim()
    state.liveText = ''
  }

  function bumpStartVersion(): number {
    startVersion += 1
    return startVersion
  }

  function isCurrentStartVersion(
    startVersion: number,
  ): boolean {
    return (
      startVersion === startVersion &&
      state.recognition
    )
  }

  function clearPendingAudio() {
    pendingAudioChunks.length = 0
  }

  function resetSourceRuntime() {
    sourceReady = false
    clearPendingAudio()
    activeBridgeToken = null
  }

  function enqueuePendingAudio( b16int: ArrayBuffer) {
    const queue = pendingAudioChunks
    if (queue.length >= maxPendingAudioChunks) {
      queue.shift()
    }
    queue.push(b16int)
  }

  function dispatchBridgeAudio(b16int: ArrayBuffer) {
      elevenLabsClient.sendAudio({ b16int })
      return
  }

  function flushPendingAudio() {
    if (!sourceReady) {
      return
    }

    const queue = pendingAudioChunks
    while (
      queue.length > 0 &&
      sourceReady &&
      state.recognition
    ) {
      const chunk = queue.shift()
      if (!chunk) {
        continue
      }
      dispatchBridgeAudio(chunk)
    }
  }


  async function requestTemporaryProviderToken(): Promise<TemporaryProviderToken> {
    const response = await $fetch('/api/token/elevenlabs', {
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      }
    })

    const token = response.token;
    if (!token) {
      throw new Error('ElevenLabs token response does not include "token".')
    }

    return {
      value: token,
      expiresAt: null,
    }
  }

  async function testTokenWorkerEndpoint(): Promise<STTTokenWorkerProbeResult> {
    const token = await requestTemporaryProviderToken()

    return {
      tokenExpiresAt: token.expiresAt,
    }
  }

  async function startSourceRecognition(
    sampleRate: number,
    startVersion: number,
  ) {
    try {
      const temporaryToken = await requestTemporaryProviderToken()
      if (!isCurrentStartVersion(startVersion)) {
        return
      }

      activeBridgeToken = temporaryToken

      options.onBridgeStart?.({
        token: temporaryToken.value,
        tokenExpiresAt: temporaryToken.expiresAt,
        sampleRate,
      })

      if (!isCurrentStartVersion(startVersion)) {
        return
      }


      await elevenLabsClient.start({
        credential: temporaryToken.value,
        sampleRate,
        languageCode: 'eng',
      })


      if (!isCurrentStartVersion(startVersion)) {
        return
      }

      sourceReady = true
      flushPendingAudio()
    } catch (error) {
      if (!isCurrentStartVersion(startVersion)) {
        return
      }

      state.recognition = false
      resetSourceRuntime()
      const message = error instanceof Error ? error.message : String(error)
      reportError(message)
    }
  }

  const elevenLabsClient = createElevenLabsRealtimeClient(
    {
      onLiveTranscript: (text) => {
        setLiveTranscript(text)
      },
      onFinalTranscript: (text) => {
        setFinalTranscript(text)
      },
      onError: (message) => {
        state.recognition = false
        resetSourceRuntime()
        state.liveText = ''
        reportError(message)
      },
      onClose: (meta) => {
        state.recognition = false
        resetSourceRuntime()
        state.liveText = ''

        if (!meta.expected && meta.code !== 1000) {
          const closeReason = meta.reason.trim()
          const reasonPart = closeReason ? `: ${closeReason}` : ''
          reportError(
            `ElevenLabs websocket closed unexpectedly (${meta.code})${reasonPart}`,
          )
        }
      },
    },
    {
      modelId: options.elevenLabsModelId,
      audioFormat: options.elevenLabsAudioFormat,
      targetSampleRate: options.elevenLabsTargetSampleRate,
      commitStrategy: options.elevenLabsCommitStrategy,
    },
  )


  function requestStartRecognition(
    sampleRate = DEFAULT_SAMPLE_RATE,
  ) {
    const startVersion = bumpStartVersion()
    const sourceState = state

    sourceState.sampleRate = sampleRate
    sourceState.liveText = ''
    sourceState.liveTextStartedAt = 0;
    sourceState.recognition = true
    resetSourceRuntime()
    clearError()

    void startSourceRecognition(sampleRate, startVersion)
  }

  function requestStopRecognition() {
    bumpStartVersion()
    const sourceState = state
    const wasRecognitionActive = sourceState.recognition
    const wasSourceReady = sourceReady
    // const activeBridgeToken = activeBridgeToken

    sourceState.recognition = false
    sourceState.liveText = ''
    sourceState.liveTextStartedAt = 0
    resetSourceRuntime()

    elevenLabsClient.stop()

    if (wasRecognitionActive && wasSourceReady) {
      options.onBridgeStop?.({
        token: activeBridgeToken?.value,
        tokenExpiresAt: activeBridgeToken?.expiresAt ?? null,
        sampleRate: sourceState.sampleRate,
      })
    }
  }

  function audioBridge(b16int: ArrayBuffer) {
    if (!state.recognition) {
      return
    }

    if (!sourceReady) {
      enqueuePendingAudio(b16int)
      return
    }

    dispatchBridgeAudio(b16int)
  }

  function clearTranscript() {
    state.finalText = ''
    state.liveText = ''
    state.liveTextStartedAt = 0
  }

  function setFinalTranscript(text: string) {
    state.finalText = text
    state.liveText = '';
    let finalizedObject = {
      timestampStart: state.liveTextStartedAt,
      timestampEnd: Date.now(),
      text,
    };
    state.history.push(finalizedObject)
    if(options.onFinalTranscript){
      options.onFinalTranscript(finalizedObject)
    }
  }

  function stopAll() {
    requestStopRecognition()

    // Ensure no stale connections remain if provider changed mid-session.
    elevenLabsClient.stopAll()

    state.history = []
    state.finalText = ''
    state.liveText = ''
    state.liveTextStartedAt = 0
    state.liveTextStartedAt = 0
    clearError()
  }

  function getProviderOptions(): readonly STTProvider[] {
    return STT_PROVIDERS
  }

  return {
    state,
    providers: STT_PROVIDERS,
    getProviderOptions,
    testTokenWorkerEndpoint,
    requestStartRecognition,
    requestStopRecognition,
    audioBridge,
    clearTranscript,
    setLiveTranscript,
    setFinalTranscript,
    appendFinalTranscript,
    stopAll,
  }
}
