export const MINIMAX_MODELS = ['MiniMax-M3', 'MiniMax-M2.7'] as const

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

export const DEFAULT_MINIMAX_MODEL = MINIMAX_MODELS[0]
export const DEFAULT_MINIMAX_BASE_URL = MINIMAX_ENDPOINTS[0].baseUrl

export type MiniMaxBaseUrl = (typeof MINIMAX_ENDPOINTS)[number]['baseUrl']

export function isMiniMaxBaseUrl(value: string | null | undefined): value is MiniMaxBaseUrl {
  return MINIMAX_ENDPOINTS.some(endpoint => endpoint.baseUrl === value)
}

export function normalizeMiniMaxBaseUrl(value: string | null | undefined): MiniMaxBaseUrl {
  return isMiniMaxBaseUrl(value) ? value : DEFAULT_MINIMAX_BASE_URL
}
