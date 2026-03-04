import { onMounted, watch, type Ref } from 'vue'

type ProviderLanguageById = Partial<Record<string, string>>

type TokenWorkerConfig = {
  baseUrl: string
  apiKey: string
  providerLanguageById: ProviderLanguageById
}

type UsePersistedTokenWorkerConfigOptions = {
  baseUrl: Ref<string>
  apiKey: Ref<string>
  providerLanguageById: Readonly<Ref<Record<string, string>>>
  setBaseUrl: (value: string) => void
  setApiKey: (value: string) => void
  supportedProviders: readonly string[]
  supportedLanguageOptionsByProvider: Record<string, readonly string[]>
  storageKey?: string
}

const DEFAULT_STORAGE_KEY = 'stt_token_worker_config'

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

      if (persistedBaseUrl) {
        options.setBaseUrl(persistedBaseUrl)
      }

      if (persistedApiKey) {
        options.setApiKey(persistedApiKey)
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
