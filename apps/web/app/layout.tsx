import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'reprod',
  description: 'Reproduce bugs with session recording and replay',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
