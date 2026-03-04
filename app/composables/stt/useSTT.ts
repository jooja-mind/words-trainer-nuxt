import { createElevenLabsRealtimeClient } from '@/composables/stt/elevenLabsRealtimeClient'

export type STTSourceType = 'mic' | 'screen'

type STTProviderErrorPayload = {
  sourceType: STTSourceType
  message: string
}

type STTBridgeStartPayload = {
  sourceType: STTSourceType
  token: string
  tokenExpiresAt: number | null
  sampleRate: number
}

type STTBridgeStopPayload = {
  sourceType: STTSourceType
  token?: string
  tokenExpiresAt: number | null
  sampleRate: number
}

type STTBridgeAudioPayload = {
  sourceType: STTSourceType
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
  supportedSources: STTSourceType[]
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
  mic: STTSourceState
  screen: STTSourceState
}

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
  onFinalTranscript?: (sourceType: STTSourceType, finalizedObject: HistoryEntry) => void
}

export type HistoryEntry = {
  timestampStart: number
  timestampEnd: number
  text: string
}

const ASSEMBLY_LANGUAGE_OPTIONS = Object.freeze([
  { value: 'en', label: 'English' },
  { value: 'multi', label: 'Auto (Multilingual beta: en/es/fr/de/it/pt)' },
]) as readonly STTProviderLanguageOption[]

const OPENAI_LANGUAGE_OPTIONS = Object.freeze([
  { value: 'auto', label: 'Auto-detect' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hy', label: 'Armenian' },
  { value: 'az', label: 'Azerbaijani' },
  { value: 'be', label: 'Belarusian' },
  { value: 'bs', label: 'Bosnian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'ca', label: 'Catalan' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hr', label: 'Croatian' },
  { value: 'cs', label: 'Czech' },
  { value: 'da', label: 'Danish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'en', label: 'English' },
  { value: 'et', label: 'Estonian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'fr', label: 'French' },
  { value: 'gl', label: 'Galician' },
  { value: 'de', label: 'German' },
  { value: 'el', label: 'Greek' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'is', label: 'Icelandic' },
  { value: 'id', label: 'Indonesian' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'kn', label: 'Kannada' },
  { value: 'kk', label: 'Kazakh' },
  { value: 'ko', label: 'Korean' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'mk', label: 'Macedonian' },
  { value: 'ms', label: 'Malay' },
  { value: 'mr', label: 'Marathi' },
  { value: 'mi', label: 'Maori' },
  { value: 'ne', label: 'Nepali' },
  { value: 'no', label: 'Norwegian' },
  { value: 'fa', label: 'Persian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ro', label: 'Romanian' },
  { value: 'ru', label: 'Russian' },
  { value: 'sr', label: 'Serbian' },
  { value: 'sk', label: 'Slovak' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'es', label: 'Spanish' },
  { value: 'sw', label: 'Swahili' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'ta', label: 'Tamil' },
  { value: 'th', label: 'Thai' },
  { value: 'tr', label: 'Turkish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ur', label: 'Urdu' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'cy', label: 'Welsh' },
]) as readonly STTProviderLanguageOption[]

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
    id: 'assemblyai',
    label: 'AssemblyAI',
    supportedSources: ['mic', 'screen'],
    languageOptions: ASSEMBLY_LANGUAGE_OPTIONS,
    defaultLanguage: 'en',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    supportedSources: ['mic', 'screen'],
    languageOptions: OPENAI_LANGUAGE_OPTIONS,
    defaultLanguage: 'auto',
  },
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
  const startVersionBySource: Record<STTSourceType, number> = {
    mic: 0,
    screen: 0,
  }

  const sourceReadyByType: Record<STTSourceType, boolean> = {
    mic: false,
    screen: false,
  }

  const pendingAudioChunksBySource: Record<STTSourceType, ArrayBuffer[]> = {
    mic: [],
    screen: [],
  }

  const activeBridgeTokenBySource: Partial<Record<STTSourceType, TemporaryProviderToken>> = {}
  const maxPendingAudioChunks = Math.max(1, options.maxPendingAudioChunks ?? DEFAULT_MAX_PENDING_AUDIO_CHUNKS)

  const state = reactive<STTState>({
    error: null,
    mic: {
      recognition: false,
      liveText: '',
      liveTextStartedAt: 0,
      finalText: '',
      sampleRate: DEFAULT_SAMPLE_RATE,
      history: [],
    },
    screen: {
      recognition: false,
      liveText: '',
      liveTextStartedAt: 0,
      finalText: '',
      sampleRate: DEFAULT_SAMPLE_RATE,
      history: [],
    },
  })

  function reportError(sourceType: STTSourceType, message: string) {
    state.error = message
    options.onProviderError?.({
      sourceType,
      message,
    })
  }

  function clearError() {
    state.error = null
  }

  function setLiveTranscript(sourceType: STTSourceType, text: string) {
    if(!state[sourceType].liveText && !!text) {
      state[sourceType].liveTextStartedAt = Date.now()
    }
    state[sourceType].liveText = text
  }

  function appendFinalTranscript(sourceType: STTSourceType, text: string) {
    state[sourceType].finalText = `${state[sourceType].finalText} ${text}`.trim()
    state[sourceType].liveText = ''
  }

  function bumpStartVersion(sourceType: STTSourceType): number {
    startVersionBySource[sourceType] += 1
    return startVersionBySource[sourceType]
  }

  function isCurrentStartVersion(
    sourceType: STTSourceType,
    startVersion: number,
  ): boolean {
    return (
      startVersionBySource[sourceType] === startVersion &&
      state[sourceType].recognition
    )
  }

  function clearPendingAudio(sourceType: STTSourceType) {
    pendingAudioChunksBySource[sourceType].length = 0
  }

  function resetSourceRuntime(sourceType: STTSourceType) {
    sourceReadyByType[sourceType] = false
    clearPendingAudio(sourceType)
    delete activeBridgeTokenBySource[sourceType]
  }

  function enqueuePendingAudio(sourceType: STTSourceType, b16int: ArrayBuffer) {
    const queue = pendingAudioChunksBySource[sourceType]
    if (queue.length >= maxPendingAudioChunks) {
      queue.shift()
    }
    queue.push(b16int)
  }

  function dispatchBridgeAudio(sourceType: STTSourceType, b16int: ArrayBuffer) {
      elevenLabsClient.sendAudio({ sourceType, b16int })
      return
  }

  function flushPendingAudio(sourceType: STTSourceType) {
    if (!sourceReadyByType[sourceType]) {
      return
    }

    const queue = pendingAudioChunksBySource[sourceType]
    while (
      queue.length > 0 &&
      sourceReadyByType[sourceType] &&
      state[sourceType].recognition
    ) {
      const chunk = queue.shift()
      if (!chunk) {
        continue
      }
      dispatchBridgeAudio(sourceType, chunk)
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
    sourceType: STTSourceType,
    sampleRate: number,
    startVersion: number,
  ) {
    try {
      const temporaryToken = await requestTemporaryProviderToken()
      if (!isCurrentStartVersion(sourceType, startVersion)) {
        return
      }

      activeBridgeTokenBySource[sourceType] = temporaryToken

      options.onBridgeStart?.({
        sourceType,
        token: temporaryToken.value,
        tokenExpiresAt: temporaryToken.expiresAt,
        sampleRate,
      })

      if (!isCurrentStartVersion(sourceType, startVersion)) {
        return
      }


      await elevenLabsClient.start({
        sourceType,
        credential: temporaryToken.value,
        sampleRate,
        languageCode: 'eng',
      })


      if (!isCurrentStartVersion(sourceType, startVersion)) {
        return
      }

      sourceReadyByType[sourceType] = true
      flushPendingAudio(sourceType)
    } catch (error) {
      if (!isCurrentStartVersion(sourceType, startVersion)) {
        return
      }

      state[sourceType].recognition = false
      resetSourceRuntime(sourceType)
      const message = error instanceof Error ? error.message : String(error)
      reportError(sourceType, message)
    }
  }

  const elevenLabsClient = createElevenLabsRealtimeClient(
    {
      onLiveTranscript: (sourceType, text) => {
        setLiveTranscript(sourceType, text)
      },
      onFinalTranscript: (sourceType, text) => {
        setFinalTranscript(sourceType, text)
      },
      onError: (sourceType, message) => {
        state[sourceType].recognition = false
        resetSourceRuntime(sourceType)
        state[sourceType].liveText = ''
        reportError(sourceType, message)
      },
      onClose: (sourceType, meta) => {
        state[sourceType].recognition = false
        resetSourceRuntime(sourceType)
        state[sourceType].liveText = ''

        if (!meta.expected && meta.code !== 1000) {
          const closeReason = meta.reason.trim()
          const reasonPart = closeReason ? `: ${closeReason}` : ''
          reportError(
            sourceType,
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
    sourceType: STTSourceType,
    sampleRate = DEFAULT_SAMPLE_RATE,
  ) {
    const startVersion = bumpStartVersion(sourceType)
    const sourceState = state[sourceType]

    sourceState.sampleRate = sampleRate
    sourceState.liveText = ''
    sourceState.liveTextStartedAt = 0;
    sourceState.recognition = true
    resetSourceRuntime(sourceType)
    clearError()

    void startSourceRecognition(sourceType, sampleRate, startVersion)
  }

  function requestStopRecognition(sourceType: STTSourceType) {
    bumpStartVersion(sourceType)
    const sourceState = state[sourceType]
    const wasRecognitionActive = sourceState.recognition
    const wasSourceReady = sourceReadyByType[sourceType]
    const activeBridgeToken = activeBridgeTokenBySource[sourceType]

    sourceState.recognition = false
    sourceState.liveText = ''
    sourceState.liveTextStartedAt = 0
    resetSourceRuntime(sourceType)

    elevenLabsClient.stop(sourceType)

    if (wasRecognitionActive && wasSourceReady) {
      options.onBridgeStop?.({
        sourceType,
        token: activeBridgeToken?.value,
        tokenExpiresAt: activeBridgeToken?.expiresAt ?? null,
        sampleRate: sourceState.sampleRate,
      })
    }
  }

  function audioBridge(b16int: ArrayBuffer, sourceType: STTSourceType) {
    const sourceState = state[sourceType]
    if (!sourceState.recognition) {
      return
    }

    if (!sourceReadyByType[sourceType]) {
      enqueuePendingAudio(sourceType, b16int)
      return
    }

    dispatchBridgeAudio(sourceType, b16int)
  }

  function clearTranscript(sourceType: STTSourceType) {
    state[sourceType].finalText = ''
    state[sourceType].liveText = ''
    state[sourceType].liveTextStartedAt = 0
  }

  function setFinalTranscript(sourceType: STTSourceType, text: string) {
    state[sourceType].finalText = text
    state[sourceType].liveText = '';
    let finalizedObject = {
      timestampStart: state[sourceType].liveTextStartedAt,
      timestampEnd: Date.now(),
      text,
    };
    state[sourceType].history.push(finalizedObject)
    if(options.onFinalTranscript){
      options.onFinalTranscript(sourceType, finalizedObject)
    }
  }

  function stopAll() {
    requestStopRecognition('mic')
    requestStopRecognition('screen')

    // Ensure no stale connections remain if provider changed mid-session.
    elevenLabsClient.stopAll()

    state.mic.history = []
    state.screen.history = []
    state.mic.finalText = ''
    state.screen.finalText = ''
    state.mic.liveText = ''
    state.screen.liveText = ''
    state.mic.liveTextStartedAt = 0
    state.screen.liveTextStartedAt = 0
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
