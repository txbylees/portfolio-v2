import { record } from 'rrweb'
import { RollingBuffer } from './buffer'

const buffer = new RollingBuffer(60_000)

console.log('[reprod] content script loaded on', window.location.href)

// ── Register listener FIRST before anything that might throw ──────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CAPTURE') {
    sendResponse({
      events: buffer.flush(),
      env: {
        url: window.location.href,
        title: document.title,
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        timestamp: Date.now(),
      },
    })
  }
})

// ── rrweb DOM recording ───────────────────────────────────────────────────────
try {
  record({
    emit(event) {
      buffer.push({ type: 'rrweb', timestamp: Date.now(), data: event })
    },
    sampling: {
      mousemove: 50,
      mouseInteraction: true,
      scroll: 150,
      input: 'last',
    },
  })
} catch (err) {
  console.warn('[reprod] rrweb init failed (non-fatal):', err)
}

// ── Console capture ───────────────────────────────────────────────────────────
const _error = console.error.bind(console)
const _warn = console.warn.bind(console)

console.error = (...args: unknown[]) => {
  buffer.push({
    type: 'console',
    timestamp: Date.now(),
    data: { level: 'error', message: args.map(String).join(' '), stack: new Error().stack },
  })
  _error(...args)
}

console.warn = (...args: unknown[]) => {
  buffer.push({
    type: 'console',
    timestamp: Date.now(),
    data: { level: 'warn', message: args.map(String).join(' ') },
  })
  _warn(...args)
}

// ── Network capture via injected script file (CSP-safe) ───────────────────────
try {
  const injected = document.createElement('script')
  injected.src = chrome.runtime.getURL('injected.js')
  injected.onload = () => injected.remove()
  ;(document.head ?? document.documentElement)?.appendChild(injected)
} catch (err) {
  console.warn('[reprod] network injection failed (non-fatal):', err)
}

window.addEventListener('message', (e) => {
  if (e.data?.__reprod && e.data.type === 'network') {
    buffer.push({ type: 'network', timestamp: Date.now(), data: e.data.data })
  }
})
