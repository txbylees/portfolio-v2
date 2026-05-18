'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/sign-in' })}
      className="text-sm text-gray-400 hover:text-white"
    >
      Sign out
    </button>
  )
}
