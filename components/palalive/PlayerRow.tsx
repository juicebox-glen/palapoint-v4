import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'

interface PlayerRowProps {
  name: string
  photoUrl?: string | null
  chipLabel?: string | null
  delta?: { direction: 'up' | 'down'; value: number } | null
}

export function PlayerRow({ name, photoUrl, chipLabel, delta }: PlayerRowProps) {
  return (
    <div className="palalive-player-row">
      <PalaLiveAvatar name={name} photoUrl={photoUrl} />
      <span className="palalive-player-name">{name}</span>
      {delta ? (
        <span className={`palalive-player-delta palalive-player-delta--${delta.direction}`}>
          {delta.direction === 'up' ? '↑' : '↓'}
          {delta.value}
        </span>
      ) : null}
      {chipLabel ? <span className="palalive-player-chip">{chipLabel}</span> : null}
    </div>
  )
}
