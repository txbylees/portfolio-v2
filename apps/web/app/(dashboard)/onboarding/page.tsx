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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Create your organisation</h1>
          <p className="mt-2 max-w-xs text-sm text-gray-500">
            Your organisation is the workspace where you manage projects, API keys, and team members.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Organisation name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Acme Inc."
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                This will also become your URL slug, e.g. <span className="font-mono">reprod.app/acme-inc</span>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-900 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create organisation →'}
            </button>
          </form>
        </div>

        {/* Steps indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] font-semibold text-green-700">✓</span>
            Account created
          </span>
          <span className="text-gray-300">→</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-800 text-[10px] font-semibold text-white">2</span>
            Create org
          </span>
          <span className="text-gray-300">→</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[10px] font-semibold text-gray-400">3</span>
            Add project
          </span>
        </div>
      </div>
    </main>
  )
}
