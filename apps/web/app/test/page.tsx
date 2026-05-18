import { Suspense } from 'react'
import { TestRecorder } from './recorder'

export default function TestPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-2xl font-bold">SDK test page</h1>
        <p className="mb-8 text-sm text-gray-400">
          Pass your API key as a query param:{' '}
          <code className="text-blue-400">/test?apiKey=rpk_xxx</code>
        </p>
        <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
          <TestRecorder />
        </Suspense>
      </div>
    </main>
  )
}
