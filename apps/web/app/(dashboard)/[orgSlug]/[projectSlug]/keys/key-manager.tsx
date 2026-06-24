'use client'

import { useState } from 'react'

interface ApiKey {
  id: string
  name: string
  prefix: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

interface Props {
  orgId: string
  projectId: string
  initialKeys: ApiKey[]
}

export function KeyManager({ orgId, projectId, initialKeys }: Props) {
  const [keys, setKeys] = useState(initialKeys)
  const [showForm, setShowForm] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/organisations/${orgId}/projects/${projectId}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: keyName }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? 'Failed to create key')
      return
    }

    const data = (await res.json()) as ApiKey & { key: string }
    const { key, ...keyMeta } = data
    setNewKey(key)
    setKeys((prev) => [keyMeta, ...prev])
    setShowForm(false)
    setKeyName('')
  }

  async function copyKey() {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {newKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="mb-2 text-sm font-medium text-amber-800">
            Save this key now — it will not be shown again
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-mono text-gray-900 break-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-sm text-amber-700 hover:text-amber-900"
          >
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {showForm ? (
        <form onSubmit={createKey} className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">New API key</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-gray-600">Key name</label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
              placeholder="e.g. Production, CI"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Generating...' : 'Generate key'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError('') }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 transition-colors"
        >
          Generate new key
        </button>
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-gray-400">No API keys yet.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-gray-900">{key.name}</p>
                <p className="mt-0.5 font-mono text-sm text-gray-400">{key.prefix}••••••••••••</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    key.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {key.isActive ? 'Active' : 'Revoked'}
                </span>
                <p className="mt-1 text-xs text-gray-400">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
