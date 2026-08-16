// MiniMax provider constants shared by the session launcher and the model selector.

export const MINIMAX_PROVIDER_ID = 'minimax' as const
export const MINIMAX_DISPLAY_NAME = 'MiniMax'

// The OpenAI-compatible API is served from a different host per region.
export const MINIMAX_REGIONS = [
  { region: 'global_en', host: 'api.minimax.io', baseUrl: 'https://api.minimax.io/v1' },
  { region: 'cn_zh', host: 'api.minimaxi.com', baseUrl: 'https://api.minimaxi.com/v1' },
] as const

export const MINIMAX_DEFAULT_BASE_URL = MINIMAX_REGIONS[0].baseUrl

export const MINIMAX_MODEL_IDS = ['MiniMax-M3', 'MiniMax-M2.7'] as const

export const MINIMAX_DEFAULT_MODEL_ID = MINIMAX_MODEL_IDS[0]

export const MINIMAX_API_KEY_STORAGE_KEY = 'humanlayer-minimax-api-key'
export const MINIMAX_MODEL_STORAGE_KEY = 'humanlayer-minimax-model'

/** Returns true when the proxy base URL points at any MiniMax regional host. */
export function isMiniMaxBaseUrl(baseUrl?: string | null): boolean {
  if (!baseUrl) return false
  return MINIMAX_REGIONS.some(({ host }) => baseUrl.includes(host))
}
