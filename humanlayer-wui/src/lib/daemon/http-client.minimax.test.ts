import { afterEach, describe, expect, mock, test } from 'bun:test'
import { HLDClient } from '../../../../hld/sdk/typescript/src/client'
import * as generated from '../../../../hld/sdk/typescript/src/generated'

// Use the real generated SDK serializers; mock only configuration and fetch.
mock.module('@humanlayer/hld-sdk', () => ({ HLDClient, ...generated }))
mock.module('./http-config', () => ({
  getDaemonUrl: async () => 'http://localhost:7777',
  getDefaultHeaders: () => ({}),
}))
mock.module('@/lib/logging', () => ({
  logger: { log() {}, debug() {}, error() {}, warn() {} },
}))
mock.module('@/lib/telemetry/sentry', () => ({ captureException() {} }))
const { HTTPDaemonClient } = await import('./http-client')
const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('MiniMax session launch HTTP boundary', () => {
  for (const provider of ['anthropic', 'openrouter', 'baseten'] as const) {
    test(`preserves ${provider} launch routing`, async () => {
      let payload: Record<string, unknown> | undefined
      globalThis.fetch = mock(async (input, init) => {
        if (String(input).endsWith('/health')) return Response.json({ status: 'ok' })
        payload = JSON.parse(String(init?.body))
        return Response.json({ data: { session_id: 'fixture' } })
      }) as typeof fetch
      await new HTTPDaemonClient().launchSession({ query: 'hello', provider, model: 'sonnet' })
      if (provider === 'anthropic') {
        expect(payload?.model).toBe('sonnet')
        expect(payload?.proxy_enabled).toBeUndefined()
      } else {
        expect(payload?.proxy_model_override).toBe('sonnet')
        expect(payload?.proxy_base_url).toBe(
          provider === 'openrouter'
            ? 'https://openrouter.ai/api/v1'
            : 'https://inference.baseten.co/v1',
        )
      }
    })
  }
  for (const base of ['https://api.minimax.io/anthropic', 'https://api.minimaxi.com/anthropic']) {
    for (const model of [
      undefined,
      'MiniMax-M3.1-Flash',
      'MiniMax-M3',
      'MiniMax-M2.7',
      'saved-custom',
    ]) {
      test(`${base} ${model || 'default'}`, async () => {
        let payload: Record<string, unknown> | undefined
        globalThis.fetch = mock(async (input, init) => {
          const url = String(input)
          if (url.endsWith('/health')) return Response.json({ status: 'ok' })
          expect(url).toBe('http://localhost:7777/api/v1/sessions')
          expect(init?.method).toBe('POST')
          payload = JSON.parse(String(init?.body))
          return Response.json({ data: { session_id: 'fixture' } })
        }) as typeof fetch
        await new HTTPDaemonClient().launchSession({
          query: 'hello',
          provider: 'minimax',
          model,
          proxy_base_url: base,
          proxy_api_key: 'fixture-key',
        })
        expect(payload?.proxy_enabled).toBe(true)
        expect(payload?.proxy_base_url).toBe(base)
        expect(payload?.proxy_model_override).toBe(model || 'MiniMax-M3.1-Flash')
        expect(payload?.proxy_api_key).toBe('fixture-key')
        expect(payload?.model).toBeUndefined()
      })
    }
  }
})
