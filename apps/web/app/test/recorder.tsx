'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ReprodInstance } from '@reprod/sdk'

export function TestRecorder() {
  const params = useSearchParams()
  const apiKey = params.get('apiKey')
  const instanceRef = useRef<ReprodInstance | null>(null)

  const [status, setStatus] = useState<'idle' | 'recording' | 'error'>('idle')
  const [log, setLog] = useState<string[]>([])

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])
  }

  useEffect(() => {
    if (!apiKey) return

    let stopped = false

    void import('@reprod/sdk').then(({ init }) => {
      if (stopped) return
      try {
        const instance = init({
          apiKey,
          endpoint: window.location.origin,
          flushIntervalMs: 3_000,
          onFlush({ status, ok, error }) {
            if (ok) {
              addLog(`✓ Flush sent — HTTP ${status}`)
            } else {
              addLog(`✗ Flush failed — ${error ?? `HTTP ${status}`}`)
            }
          },
        })
        instanceRef.current = instance
        setStatus('recording')
        addLog('SDK initialised — first flush in 3s')
      } catch (err) {
        setStatus('error')
        addLog(`SDK init error: ${String(err)}`)
      }
    }).catch((err: unknown) => {
      setStatus('error')
      addLog(`Failed to load SDK: ${String(err)}`)
    })

    return () => {
      stopped = true
      instanceRef.current?.stop()
      instanceRef.current = null
    }
  }, [apiKey])

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-yellow-400">No API key provided.</p>
        <p className="mt-1 text-sm text-gray-400">
          Add <code className="text-blue-400">?apiKey=rpk_xxx</code> to the URL.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              status === 'recording'
                ? 'animate-pulse bg-green-400'
                : status === 'error'
                  ? 'bg-red-400'
                  : 'bg-gray-600'
            }`}
          />
          <span className="font-medium capitalize">{status}</span>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Key: <code className="text-white">{apiKey.slice(0, 12)}••••</code>
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-400">Trigger test events</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              console.error('Test error', new Error('reprod test'))
              addLog('Triggered console.error')
            }}
            className="rounded-lg border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-400 hover:bg-red-900"
          >
            console.error()
          </button>
          <button
            onClick={() => {
              void fetch('/api/ingest/session', {
                method: 'POST',
                body: '{}',
                headers: { 'Content-Type': 'application/json' },
              }).then(() => addLog('Triggered 401 network request'))
            }}
            className="rounded-lg border border-yellow-900 bg-yellow-950 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-900"
          >
            Failed fetch (401)
          </button>
          <button
            onClick={() => {
              void fetch('/api/nonexistent').then(() => addLog('Triggered 404'))
            }}
            className="rounded-lg border border-yellow-900 bg-yellow-950 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-900"
          >
            404 fetch
          </button>
          <button
            onClick={() => {
              instanceRef.current?.stop()
              setStatus('idle')
              addLog('Recording stopped')
            }}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-400">Activity log</h2>
        {log.length === 0 ? (
          <p className="font-mono text-xs text-gray-500">Waiting for first flush…</p>
        ) : (
          <div className="space-y-1 font-mono text-xs text-gray-300">
            {log.map((line, i) => (
              <p key={i} className={line.includes('✗') ? 'text-red-400' : line.includes('✓') ? 'text-green-400' : ''}>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Flushes every 3 seconds. A green ✓ means the session reached the database.
      </p>
    </div>
  )
}
