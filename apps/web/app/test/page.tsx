import { Suspense } from 'react'
import { TestRecorder } from './recorder'

export default function TestPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-2xl font-bold">SDK test page</h1>
        <p className="mb-8 text-sm text-gray-500">
          Pass your API key as a query param:{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-green-800 text-xs">/test?apiKey=rpk_xxx</code>
        </p>
        <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
          <TestRecorder />
        </Suspense>
      </div>
    </main>
  )
}
