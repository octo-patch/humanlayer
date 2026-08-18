import { describe, test, expect } from 'bun:test'
import {
  MINIMAX_BASE_URL,
  MINIMAX_DEFAULT_MODEL,
  MINIMAX_MODEL_IDS,
  isMiniMaxBaseUrl,
} from './minimax'

describe('minimax provider constants', () => {
  test('exposes the selectable model IDs with the default first', () => {
    expect(MINIMAX_MODEL_IDS).toEqual(['MiniMax-M3', 'MiniMax-M2.7'])
    expect(MINIMAX_DEFAULT_MODEL).toBe('MiniMax-M3')
  })

  test('default base URL is the OpenAI-compatible endpoint', () => {
    expect(MINIMAX_BASE_URL).toBe('https://api.minimax.io/v1')
  })
})

describe('isMiniMaxBaseUrl', () => {
  test('detects every regional endpoint', () => {
    expect(isMiniMaxBaseUrl(MINIMAX_BASE_URL)).toBe(true)
    expect(isMiniMaxBaseUrl('https://api.minimaxi.com/v1')).toBe(true)
  })

  test('does not match the other proxy providers', () => {
    expect(isMiniMaxBaseUrl('https://openrouter.ai/api/v1')).toBe(false)
    expect(isMiniMaxBaseUrl('https://inference.baseten.co/v1')).toBe(false)
  })

  test('handles missing values', () => {
    expect(isMiniMaxBaseUrl(undefined)).toBe(false)
    expect(isMiniMaxBaseUrl(null)).toBe(false)
    expect(isMiniMaxBaseUrl('')).toBe(false)
  })
})
