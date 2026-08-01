import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_MINIMAX_BASE_URL,
  DEFAULT_MINIMAX_MODEL,
  MINIMAX_ENDPOINTS,
  MINIMAX_MODELS,
  normalizeMiniMaxBaseUrl,
} from './minimax'

describe('MiniMax configuration', () => {
  test('exposes the supported models in default order', () => {
    expect(MINIMAX_MODELS).toEqual(['MiniMax-M3', 'MiniMax-M2.7'])
    expect(DEFAULT_MINIMAX_MODEL).toBe('MiniMax-M3')
  })

  test('bounds the regional OpenAI-compatible endpoints', () => {
    expect(MINIMAX_ENDPOINTS).toEqual([
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
    ])
    expect(DEFAULT_MINIMAX_BASE_URL).toBe('https://api.minimax.io/v1')
  })

  test('normalizes unknown endpoints to the global endpoint', () => {
    expect(normalizeMiniMaxBaseUrl('https://api.minimaxi.com/v1')).toBe('https://api.minimaxi.com/v1')
    expect(normalizeMiniMaxBaseUrl('https://example.com/v1')).toBe(DEFAULT_MINIMAX_BASE_URL)
  })
})
