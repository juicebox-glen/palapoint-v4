import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import '@/app/globals.css'
import '@/app/styles/setup-form.css'
import '@/app/styles/control-panel.css'
import '@/app/styles/design-system.css'
import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-design-system.css'

export const metadata: Metadata = {
  title: 'PalaPoint Design System',
  robots: 'noindex, nofollow',
}

export default function DesignSystemLayout({ children }: { children: ReactNode }) {
  return <div className="ds-layout">{children}</div>
}
