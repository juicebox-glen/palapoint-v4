import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kink Frame Skeleton — Venue TV',
  description: 'Full-bleed kink frame v2 geometry preview for venue displays',
}

export default function KinkFrameSkeletonDisplayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
