'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/sign-in' })}
      className="text-sm text-gray-500 hover:text-gray-900"
    >
      Sign out
    </button>
  )
}
