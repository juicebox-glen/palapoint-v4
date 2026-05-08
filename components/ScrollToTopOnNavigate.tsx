'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Resets window scroll when the route pathname changes so stacked flows
 * (e.g. matchplay setup → players → hub) start at the top instead of inheriting position.
 */
export function ScrollToTopOnNavigate() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
