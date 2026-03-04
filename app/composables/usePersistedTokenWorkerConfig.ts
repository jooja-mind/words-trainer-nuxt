import { onMounted, watch, type Ref } from 'vue'
import type { STTProviderId } from '@/composables/useSTT'

type ProviderLanguageById = Partial<Record<STTProviderId, string>>

type TokenWorkerConfig = {
  baseUrl: string
  apiKey: string
  provider: STTProviderId
  providerLanguageById: ProviderLanguageById
}

type UsePersistedTokenWorkerConfigOptions = {
  baseUrl: Ref<string>
  apiKey: Ref<string>
  provider: Ref<STTProviderId>
  providerLanguageById: Readonly<Ref<Record<STTProviderId, string>>>
  setBaseUrl: (value: string) => void
  setApiKey: (value: string) => void
  setProvider: (provider: STTProviderId) => void | boolean
  setProviderLanguage: (provider: STTProviderId, language: string) => void | boolean
  supportedProviders: readonly STTProviderId[]
  supportedLanguageOptionsByProvider: Record<STTProviderId, readonly string[]>
  storageKey?: string
}

const DEFAULT_STORAGE_KEY = 'stt_token_worker_config'

function isSTTProviderId(
  value: unknown,
  supportedProviders: readonly STTProviderId[],
): value is STTProviderId {
  return typeof value === 'string' && supportedProviders.includes(value as STTProviderId)
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function usePersistedTokenWorkerConfig(options: UsePersistedTokenWorkerConfigOptions) {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY

  function createProviderLanguageSnapshot(): ProviderLanguageById {
    const snapshot: ProviderLanguageById = {}
    for (const providerId of options.supportedProviders) {
      const language = options.providerLanguageById.value[providerId]
      if (typeof language === 'string' && language) {
        snapshot[providerId] = language
      }
    }
    return snapshot
  }

  function persistTokenWorkerConfig() {
    const payload: TokenWorkerConfig = {
      baseUrl: options.baseUrl.value,
      apiKey: options.apiKey.value,
      provider: options.provider.value,
      providerLanguageById: createProviderLanguageSnapshot(),
    }

    localStorage.setItem(storageKey, JSON.stringify(payload))
  }

  function loadPersistedTokenWorkerConfig() {
    const rawValue = localStorage.getItem(storageKey)
    if (!rawValue) {
      return
    }

    try {
      const parsedConfig = JSON.parse(rawValue) as Partial<TokenWorkerConfig>
      const persistedBaseUrl = typeof parsedConfig.baseUrl === 'string' ? parsedConfig.baseUrl : ''
      const persistedApiKey = typeof parsedConfig.apiKey === 'string' ? parsedConfig.apiKey : ''
      const persistedProvider = isSTTProviderId(parsedConfig.provider, options.supportedProviders)
        ? parsedConfig.provider
        : options.provider.value

      if (persistedBaseUrl) {
        options.setBaseUrl(persistedBaseUrl)
      }

      if (persistedApiKey) {
        options.setApiKey(persistedApiKey)
      }

      if (persistedProvider !== options.provider.value) {
        options.setProvider(persistedProvider)
      }

      const persistedProviderLanguageById = isObjectRecord(parsedConfig.providerLanguageById)
        ? parsedConfig.providerLanguageById
        : null
      let hasInvalidProviderLanguage = false

      for (const providerId of options.supportedProviders) {
        const persistedLanguage = persistedProviderLanguageById?.[providerId]
        if (typeof persistedLanguage !== 'string' || !persistedLanguage) {
          continue
        }

        const supportedLanguages = options.supportedLanguageOptionsByProvider[providerId] ?? []
        if (!supportedLanguages.includes(persistedLanguage)) {
          hasInvalidProviderLanguage = true
          continue
        }

        options.setProviderLanguage(providerId, persistedLanguage)
      }

      // Migrate legacy payloads that had no provider/apiKey or
      // used an old shape without providerLanguageById.
      if (
        !Object.prototype.hasOwnProperty.call(parsedConfig, 'provider') ||
        !Object.prototype.hasOwnProperty.call(parsedConfig, 'apiKey') ||
        !Object.prototype.hasOwnProperty.call(parsedConfig, 'providerLanguageById') ||
        hasInvalidProviderLanguage
      ) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            baseUrl: persistedBaseUrl,
            apiKey: persistedApiKey,
            provider: persistedProvider,
            providerLanguageById: createProviderLanguageSnapshot(),
          } satisfies TokenWorkerConfig),
        )
      }
    } catch (error) {
      console.error('Failed to parse persisted token worker config', error)
    }
  }

  onMounted(() => {
    loadPersistedTokenWorkerConfig()
  })

  watch(
    () => [
      options.baseUrl.value,
      options.apiKey.value,
      options.provider.value,
      ...options.supportedProviders.map((providerId) => options.providerLanguageById.value[providerId] ?? ''),
    ],
    () => {
      persistTokenWorkerConfig()
    },
  )

  return {
    loadPersistedTokenWorkerConfig,
    persistTokenWorkerConfig,
  }
}
