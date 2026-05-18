'use client'

import { useActionState } from 'react'
import { saveWebhookUrl } from './actions'

export default function WebhookForm({
  orgSlug,
  projectSlug,
  currentUrl,
}: {
  orgSlug: string
  projectSlug: string
  currentUrl: string | null
}) {
  const action = saveWebhookUrl.bind(null, orgSlug, projectSlug)
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="webhookUrl" className="mb-2 block text-sm font-medium text-gray-300">
          Webhook URL
        </label>
        <input
          id="webhookUrl"
          name="webhookUrl"
          type="url"
          defaultValue={currentUrl ?? ''}
          placeholder="https://your-app.com/webhook"
          className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-gray-500"
        />
        <p className="mt-2 text-xs text-gray-500">
          We&apos;ll POST a JSON payload here the first time a session records an error.
          Leave blank to disable.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-sm text-green-400">Webhook saved.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-950 hover:bg-gray-200 disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
