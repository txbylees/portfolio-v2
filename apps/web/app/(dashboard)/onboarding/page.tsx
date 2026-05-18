'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/organisations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? 'Something went wrong')
      return
    }

    const org = (await res.json()) as { slug: string }
    router.push(`/${org.slug}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm px-4">
        <h1 className="mb-2 text-2xl font-bold text-white">Create your organisation</h1>
        <p className="mb-8 text-sm text-gray-400">
          This is the workspace where you manage projects and team members.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Organisation name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Acme Inc."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create organisation'}
          </button>
        </form>
      </div>
    </main>
  )
}
