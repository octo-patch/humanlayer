import { describe, expect, test } from 'bun:test'
import {
  MINIMAX_BASE_URLS,
  MINIMAX_DEFAULT_BASE_URL,
  MINIMAX_DEFAULT_MODEL_ID,
  MINIMAX_MODEL_IDS,
  isMiniMaxBaseUrl,
} from './minimax'

describe('MiniMax provider metadata', () => {
  test('exposes the selectable model IDs', () => {
    expect([...MINIMAX_MODEL_IDS]).toEqual(['MiniMax-M3', 'MiniMax-M2.7'])
    expect(MINIMAX_DEFAULT_MODEL_ID).toBe('MiniMax-M3')
  })

  test('defaults to the global regional endpoint', () => {
    expect(MINIMAX_DEFAULT_BASE_URL).toBe(MINIMAX_BASE_URLS.global_en)
  })

  test('recognizes every regional base URL', () => {
    for (const baseUrl of Object.values(MINIMAX_BASE_URLS)) {
      expect(isMiniMaxBaseUrl(baseUrl)).toBe(true)
    }
  })

  test('does not claim other provider base URLs', () => {
    expect(isMiniMaxBaseUrl(undefined)).toBe(false)
    expect(isMiniMaxBaseUrl('')).toBe(false)
    expect(isMiniMaxBaseUrl('https://openrouter.ai/api/v1')).toBe(false)
    expect(isMiniMaxBaseUrl('https://inference.baseten.co/v1')).toBe(false)
  })
})
