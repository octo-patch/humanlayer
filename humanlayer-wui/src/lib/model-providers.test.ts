import { describe, expect, it } from 'bun:test'
import {
  getMiniMaxBaseUrl,
  isMiniMaxBaseUrl,
  MINIMAX_DEFAULT_BASE_URL,
  MINIMAX_DEFAULT_MODEL,
  MINIMAX_ENDPOINTS,
  MINIMAX_MODELS,
} from './model-providers'

describe('MiniMax provider configuration', () => {
  it('exposes the supported model IDs', () => {
    expect(MINIMAX_DEFAULT_MODEL).toBe('MiniMax-M3')
    expect(MINIMAX_MODELS).toEqual(['MiniMax-M3', 'MiniMax-M2.7'])
  })

  it('recognizes both regional endpoints', () => {
    expect(MINIMAX_ENDPOINTS.map(endpoint => endpoint.baseUrl)).toEqual([
      'https://api.minimax.io/v1',
      'https://api.minimaxi.com/v1',
    ])
    expect(isMiniMaxBaseUrl('https://api.minimaxi.com/v1')).toBe(true)
  })

  it('falls back to the global endpoint', () => {
    expect(getMiniMaxBaseUrl('https://example.com/v1')).toBe(MINIMAX_DEFAULT_BASE_URL)
  })
})
