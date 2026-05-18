import type { NetworkRequestEntry } from '@reprod/shared'

export function patchNetwork(
  onCapture: (entry: NetworkRequestEntry) => void,
): () => void {
  const OriginalXHR = window.XMLHttpRequest
  const originalFetch = window.fetch

  // Patch fetch
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method = (init?.method ?? 'GET').toUpperCase()
    const start = Date.now()

    const response = await originalFetch(input, init)

    if (!response.ok) {
      onCapture({
        url,
        method,
        status: response.status,
        duration: Date.now() - start,
        timestamp: start,
      })
    }

    return response
  }

  // Patch XHR
  class PatchedXHR extends OriginalXHR {
    private _method = 'GET'
    private _url = ''
    private _start = 0

    override open(method: string, url: string | URL, ...rest: [boolean?, string?, string?]) {
      this._method = method.toUpperCase()
      this._url = url.toString()
      super.open(method, url, ...(rest as [boolean, string, string]))
    }

    override send(body?: Document | XMLHttpRequestBodyInit | null) {
      this._start = Date.now()
      this.addEventListener('loadend', () => {
        if (this.status >= 400 || this.status === 0) {
          onCapture({
            url: this._url,
            method: this._method,
            status: this.status,
            duration: Date.now() - this._start,
            timestamp: this._start,
          })
        }
      })
      super.send(body)
    }
  }

  window.XMLHttpRequest = PatchedXHR

  return () => {
    window.fetch = originalFetch
    window.XMLHttpRequest = OriginalXHR
  }
}
