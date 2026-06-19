import {
  getPlayerInitials,
  getSpectatorTeamSurnameRows,
  SPECTATOR_PREGAME_NAME_MAX_LENGTH,
} from '@/lib/utils/name-format'

export type PregameTeamSide = 'a' | 'b'

export interface SpectatorPregameTeamInnerProps {
  side: PregameTeamSide
  player1: string | null | undefined
  player2: string | null | undefined
  photo1?: string | null
  photo2?: string | null
}

/** Photos + name stack shared by spectator pre-game and court ready screens. */
export function SpectatorPregameTeamInner({
  side,
  player1,
  player2,
  photo1,
  photo2,
}: SpectatorPregameTeamInnerProps) {
  const photoClass = side === 'a' ? 'spectator-pregame-photo-a' : 'spectator-pregame-photo-b'
  const namesClass = side === 'a' ? 'spectator-pregame-names-a' : 'spectator-pregame-names-b'
  const rows = getSpectatorTeamSurnameRows(
    player1,
    player2,
    side === 'a' ? 1 : 2,
    SPECTATOR_PREGAME_NAME_MAX_LENGTH
  )

  const renderPhoto = (photo: string | null | undefined, name: string | null | undefined) => (
    <div className={`spectator-pregame-photo-wrap ${photoClass}`}>
      {photo ? (
        <img src={photo} alt="" />
      ) : (
        <span className="spectator-pregame-initials">{getPlayerInitials(name)}</span>
      )}
    </div>
  )

  return (
    <div className="spectator-pregame-side-inner">
      <div className="spectator-pregame-photos">
        {renderPhoto(photo1, player1)}
        {renderPhoto(photo2, player2)}
      </div>
      <div className={`spectator-pregame-names ${namesClass}`}>
        {side === 'b' ? <div className="spectator-pregame-names-divider" aria-hidden /> : null}
        {rows.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
        {side === 'a' ? <div className="spectator-pregame-names-divider" aria-hidden /> : null}
      </div>
    </div>
  )
}
