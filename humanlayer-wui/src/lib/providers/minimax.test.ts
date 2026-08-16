import { describe, it, expect } from 'bun:test'
import {
  MINIMAX_DEFAULT_BASE_URL,
  MINIMAX_DEFAULT_MODEL_ID,
  MINIMAX_MODEL_IDS,
  MINIMAX_REGIONS,
  isMiniMaxBaseUrl,
} from './minimax'

describe('minimax provider constants', () => {
  it('exposes the selectable model ids', () => {
    expect([...MINIMAX_MODEL_IDS]).toEqual(['MiniMax-M3', 'MiniMax-M2.7'])
    expect(MINIMAX_DEFAULT_MODEL_ID).toBe('MiniMax-M3')
  })

  it('defaults to the global regional endpoint', () => {
    expect(MINIMAX_DEFAULT_BASE_URL).toBe('https://api.minimax.io/v1')
    expect(MINIMAX_REGIONS.map(region => region.region)).toEqual(['global_en', 'cn_zh'])
  })

  it('recognises every regional base url', () => {
    for (const region of MINIMAX_REGIONS) {
      expect(isMiniMaxBaseUrl(region.baseUrl)).toBe(true)
    }
  })

  it('does not recognise unrelated base urls', () => {
    expect(isMiniMaxBaseUrl(undefined)).toBe(false)
    expect(isMiniMaxBaseUrl(null)).toBe(false)
    expect(isMiniMaxBaseUrl('')).toBe(false)
    expect(isMiniMaxBaseUrl('https://api.anthropic.com')).toBe(false)
  })
})
