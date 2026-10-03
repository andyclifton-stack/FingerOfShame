/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

describe('offline shell', () => {
  function worker() {
    const handlers: Record<string, (event: object) => void> = {}
    const stores = new Map<string, Map<string, string>>([['other-app-cache', new Map()], ['dartscore-old', new Map()]])
    const messages: object[] = []
    const root = 'https://example.test/FingerOfShame/DartScore/'
    const source = readFileSync(new URL('../../scripts/sw-template.js', import.meta.url), 'utf8').replace('__VERSION__', 'test').replace('__ASSETS__', JSON.stringify(['index.html', 'assets/app.js', 'assets/app.css']))
    const caches = {
      open: async (key: string) => {
        if (!stores.has(key)) stores.set(key, new Map())
        const store = stores.get(key)!
        return { addAll: async (urls: string[]) => urls.forEach(url => store.set(url, url.endsWith('index.html') ? '<html>offline app</html>' : 'bundle')), match: async (req: string | { url: string }) => store.get(typeof req === 'string' ? req : req.url) }
      },
      keys: async () => [...stores.keys()],
      delete: async (key: string) => stores.delete(key),
    }
    runInNewContext(source, {
      self: { location: { href: root + 'sw.js' }, addEventListener: (event: string, handler: (event: object) => void) => { handlers[event] = handler }, clients: { claim: async () => {}, matchAll: async () => [{ postMessage: (message: object) => messages.push(message) }] } },
      caches, URL, Response, fetch: async () => { throw new Error('Network unavailable') },
    })
    return { handlers, stores, messages, root }
  }
  it('precaches the shell, cleans only its own caches, and serves navigation and bundles without network', async () => {
    const { handlers, stores, messages, root } = worker()
    let pending = Promise.resolve()
    handlers.install({ waitUntil: (p: Promise<void>) => { pending = p } }); await pending
    handlers.activate({ waitUntil: (p: Promise<void>) => { pending = p } }); await pending
    expect(stores.has('other-app-cache')).toBe(true); expect(stores.has('dartscore-old')).toBe(false)
    expect(messages).toEqual([{ type: 'OFFLINE_READY' }])
    let response: Promise<string> | undefined
    handlers.fetch({ request: { url: root, method: 'GET', mode: 'navigate' }, respondWith: (p: Promise<string>) => { response = p } })
    expect(await response).toBe('<html>offline app</html>')
    handlers.fetch({ request: { url: root + 'assets/app.js', method: 'GET', mode: 'cors' }, respondWith: (p: Promise<string>) => { response = p } })
    expect(await response).toBe('bundle')
  })
  it('does not intercept the hub, other apps or writes', () => {
    const { handlers, root } = worker()
    for (const request of [{ url: 'https://example.test/FingerOfShame/', method: 'GET' }, { url: root, method: 'POST' }, { url: 'https://other.test/', method: 'GET' }]) {
      let intercepted = false
      handlers.fetch({ request, respondWith: () => { intercepted = true } })
      expect(intercepted).toBe(false)
    }
  })
})
