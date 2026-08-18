// MiniMax provider constants shared by the session launcher and the model selector.

// Default OpenAI-compatible base URL used for the proxy configuration.
export const MINIMAX_BASE_URL = 'https://api.minimax.io/v1'

// Matches every regional MiniMax API host.
export const MINIMAX_HOST_MARKER = 'minimax'

// Model IDs selectable for MiniMax sessions.
export const MINIMAX_MODEL_IDS = ['MiniMax-M3', 'MiniMax-M2.7'] as const

// Model used when no explicit selection has been made yet.
export const MINIMAX_DEFAULT_MODEL = MINIMAX_MODEL_IDS[0]

// True when the given proxy base URL points at any regional MiniMax endpoint.
export function isMiniMaxBaseUrl(baseUrl: string | null | undefined): boolean {
  return !!baseUrl && baseUrl.includes(MINIMAX_HOST_MARKER)
}
