import { getPlayerInitials } from '@/lib/utils/name-format'

interface PalaLiveAvatarProps {
  name: string
  photoUrl?: string | null
  className?: string
}

export function PalaLiveAvatar({ name, photoUrl, className }: PalaLiveAvatarProps) {
  const modifier = photoUrl ? 'palalive-player-avatar--photo' : 'palalive-player-avatar--initials'
  const classes = ['palalive-player-avatar', modifier, className].filter(Boolean).join(' ')

  if (photoUrl) {
    return (
      <span className={classes}>
        <img src={photoUrl} alt="" />
      </span>
    )
  }

  return <span className={classes}>{getPlayerInitials(name)}</span>
}
