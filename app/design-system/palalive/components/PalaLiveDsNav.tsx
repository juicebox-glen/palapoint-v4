import Link from 'next/link'

const LINKS = [
  { href: '/design-system/palalive', label: 'Overview' },
  { href: '/design-system/palalive/foundations', label: 'Foundations' },
  { href: '/design-system/palalive/components', label: 'Components' },
  { href: '/design-system/palalive/screens', label: 'Screens' },
] as const

export function PalaLiveDsNav({ active }: { active: (typeof LINKS)[number]['href'] }) {
  return (
    <nav className="pl-ds-nav" aria-label="PalaLive design system">
      <Link href="/design-system" className="pl-ds-nav-legacy">
        ← v4 design system
      </Link>
      <div className="pl-ds-nav-links">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`pl-ds-nav-link${active === link.href ? ' is-active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
