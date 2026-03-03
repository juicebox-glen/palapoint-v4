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
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <div
            style={{
              position: 'fixed',
              bottom: 4,
              right: 4,
              fontSize: '10px',
              color: 'rgba(255,255,255,0.3)',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          >
            v{Date.now()}
          </div>
        )}
      </body>
    </html>
  )
}
