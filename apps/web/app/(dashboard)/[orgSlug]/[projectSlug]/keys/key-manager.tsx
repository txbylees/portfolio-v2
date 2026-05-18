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
        <div className="rounded-xl border border-yellow-700 bg-yellow-950/30 p-5">
          <p className="mb-2 text-sm font-medium text-yellow-400">
            Save this key now — it will not be shown again
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-mono text-white break-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 rounded-lg bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-sm text-gray-400 hover:text-white"
          >
            I've saved it — dismiss
          </button>
        </div>
      )}

      {showForm ? (
        <form onSubmit={createKey} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 font-semibold">New API key</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-gray-400">Key name</label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
              placeholder="e.g. Production, CI"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate key'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError('') }}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Generate new key
        </button>
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-gray-400">No API keys yet.</p>
      ) : (
        <div className="divide-y divide-gray-800 rounded-xl border border-gray-800">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="mt-0.5 font-mono text-sm text-gray-400">{key.prefix}••••••••••••</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    key.isActive
                      ? 'bg-green-950 text-green-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {key.isActive ? 'Active' : 'Revoked'}
                </span>
                <p className="mt-1 text-xs text-gray-500">
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
