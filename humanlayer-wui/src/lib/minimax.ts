export const MINIMAX_MODELS = ['MiniMax-M3.1-Flash', 'MiniMax-M3'] as const
export const MINIMAX_BASE_URL = 'https://api.minimax.io/anthropic'
export const MINIMAX_CN_BASE_URL = 'https://api.minimaxi.com/anthropic'

export function isMiniMaxBaseUrl(baseUrl?: string | null): boolean {
  return [MINIMAX_BASE_URL, MINIMAX_CN_BASE_URL].some(
    base => baseUrl?.replace(/\/v1(?:\/messages)?\/?$/, '').replace(/\/$/, '') === base,
  )
}
