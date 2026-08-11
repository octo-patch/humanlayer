export type ModelProvider = 'anthropic' | 'openrouter' | 'baseten' | 'minimax'

export const MINIMAX_MODELS = ['MiniMax-M3', 'MiniMax-M2.7'] as const
export const MINIMAX_DEFAULT_MODEL = MINIMAX_MODELS[0]

export const MINIMAX_ENDPOINTS = [
  {
    region: 'global_en',
    label: 'Global',
    baseUrl: 'https://api.minimax.io/v1',
  },
  {
    region: 'cn_zh',
    label: 'China',
    baseUrl: 'https://api.minimaxi.com/v1',
  },
] as const

export type MiniMaxBaseUrl = (typeof MINIMAX_ENDPOINTS)[number]['baseUrl']

export const MINIMAX_DEFAULT_BASE_URL = MINIMAX_ENDPOINTS[0].baseUrl

export const MINIMAX_STORAGE_KEYS = {
  apiKey: 'humanlayer-minimax-api-key',
  model: 'humanlayer-minimax-model',
  baseUrl: 'humanlayer-minimax-base-url',
} as const

export function isMiniMaxBaseUrl(value?: string | null): value is MiniMaxBaseUrl {
  return MINIMAX_ENDPOINTS.some(endpoint => endpoint.baseUrl === value)
}

export function getMiniMaxBaseUrl(value?: string | null): MiniMaxBaseUrl {
  return isMiniMaxBaseUrl(value) ? value : MINIMAX_DEFAULT_BASE_URL
}
