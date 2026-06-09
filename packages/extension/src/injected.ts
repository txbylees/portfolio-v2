// Runs in the page's main world to intercept fetch + XHR.
// Communicates back to the content script via window.postMessage.
// Loaded via script.src (not inline) so it works on pages with strict CSPs.
;(function () {
  const _fetch = window.fetch
  window.fetch = async function (...args) {
    const start = Date.now()
    const url =
      typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url ?? ''
    const method = ((args[1] as RequestInit)?.method ?? 'GET').toUpperCase()
    try {
      const res = await _fetch.apply(this, args as Parameters<typeof fetch>)
      if (!res.ok) {
        window.postMessage(
          {
            __reprod: true,
            type: 'network',
            data: { url, method, status: res.status, duration: Date.now() - start, timestamp: Date.now() },
          },
          '*'
        )
      }
      return res
    } catch (err) {
      window.postMessage(
        {
          __reprod: true,
          type: 'network',
          data: { url, method, status: 0, duration: Date.now() - start, timestamp: Date.now() },
        },
        '*'
      )
      throw err
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _open = XMLHttpRequest.prototype.open as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _send = XMLHttpRequest.prototype.send as any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  XMLHttpRequest.prototype.open = function (method: string, url: string, ...rest: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this as any).__reprod_method = method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this as any).__reprod_url = url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this as any).__reprod_start = Date.now()
    return _open.apply(this, [method, url, ...rest])
  }

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('loadend', () => {
      if (this.status === 0 || this.status >= 400) {
        window.postMessage(
          {
            __reprod: true,
            type: 'network',
            data: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              url: (this as any).__reprod_url,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              method: (this as any).__reprod_method ?? 'GET',
              status: this.status,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              duration: Date.now() - (this as any).__reprod_start,
              timestamp: Date.now(),
            },
          },
          '*'
        )
      }
    })
    return _send.apply(this, args)
  }
})()
