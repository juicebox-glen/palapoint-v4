'use client'

import { getPlayerInitials } from '@/lib/utils/name-format'

export function MatchPreviewAvatar({
  photo,
  name,
  team,
}: {
  photo?: string | null
  name?: string | null
  team: 'a' | 'b'
}) {
  const initials = getPlayerInitials(name)

  return (
    <div className={`preview-avatar preview-avatar-${team}`}>
      {photo ? (
        <img src={photo} alt={name?.trim() || 'Player'} />
      ) : (
        <span className="preview-avatar-initials">{initials}</span>
      )}
    </div>
  )
}
