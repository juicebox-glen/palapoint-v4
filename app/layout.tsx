import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PalaPoint V4',
  description: 'Padel scoring displays',
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
