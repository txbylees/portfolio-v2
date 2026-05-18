'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export default function SessionSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('q', e.target.value)
    } else {
      params.delete('q')
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <input
      type="search"
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder="Filter by URL…"
      className={`w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-gray-500 ${isPending ? 'opacity-60' : ''}`}
    />
  )
}
