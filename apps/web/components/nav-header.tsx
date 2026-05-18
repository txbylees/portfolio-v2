import Link from 'next/link'

type Crumb = { label: string; href?: string }

export function NavHeader({
  crumbs = [],
  right,
}: {
  crumbs?: Crumb[]
  right?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-800 bg-gray-950/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.45)]">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          <span className="font-semibold tracking-tight">Reprod</span>
        </Link>

        {crumbs.length > 0 && (
          <nav className="flex items-center gap-0.5 text-sm">
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center">
                <span className="px-1.5 text-gray-700">/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="rounded px-1 text-gray-400 hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="px-1 text-white">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      {right && <div className="flex items-center gap-3">{right}</div>}
    </header>
  )
}
