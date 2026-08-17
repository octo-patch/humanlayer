// MiniMax provider metadata shared by the provider selector and the launch configuration.
// The MiniMax API is OpenAI-compatible, so sessions reach it through the same proxy path as
// the other non-Anthropic providers.

export const MINIMAX_PROVIDER_LABEL = 'MiniMax'

export const MINIMAX_MODEL_IDS = ['MiniMax-M3', 'MiniMax-M2.7'] as const

export type MiniMaxModelId = (typeof MINIMAX_MODEL_IDS)[number]

export const MINIMAX_DEFAULT_MODEL_ID: MiniMaxModelId = MINIMAX_MODEL_IDS[0]

// Regional OpenAI-compatible base URLs. The global endpoint is the default; the mainland China
// endpoint is recognized as well so a session already configured against it resolves back to
// MiniMax instead of falling through to a different provider.
export const MINIMAX_BASE_URLS = {
  global_en: 'https://api.minimax.io/v1',
  cn_zh: 'https://api.minimaxi.com/v1',
} as const

export type MiniMaxRegion = keyof typeof MINIMAX_BASE_URLS

export const MINIMAX_DEFAULT_BASE_URL: string = MINIMAX_BASE_URLS.global_en

const MINIMAX_HOSTS: string[] = Object.values(MINIMAX_BASE_URLS).map(url => new URL(url).host)

/** Returns true when a session proxy base URL points at one of the MiniMax regions. */
export function isMiniMaxBaseUrl(baseUrl?: string | null): boolean {
  if (!baseUrl) {
    return false
  }
  return MINIMAX_HOSTS.some(host => baseUrl.includes(host))
}

export const MINIMAX_API_KEY_STORAGE_KEY = 'humanlayer-minimax-api-key'
export const MINIMAX_MODEL_STORAGE_KEY = 'humanlayer-minimax-model'
