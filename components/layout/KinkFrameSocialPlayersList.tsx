'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { KINK_FRAME_SOCIAL_GAME } from '@/lib/layout/kink-frame-social-data'
import { KINK_FRAME_SOCIAL_PLAYERS } from '@/lib/layout/kink-frame-social-players'
import { getPlayerInitials } from '@/lib/utils/name-format'

function PlayerPhoto({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="kink-frame-social-player-photo">
      {photoUrl ? (
        <img src={photoUrl} alt="" />
      ) : (
        <span aria-hidden>{getPlayerInitials(name)}</span>
      )}
    </div>
  )
}

/** Social night roster — dark pill rows with optional timed scroll when list overflows. */
export function KinkFrameSocialPlayersList() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [scrollVars, setScrollVars] = useState<CSSProperties>({})
  const [shouldScroll, setShouldScroll] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    const list = listRef.current
    if (!viewport || !list) return

    const syncScroll = () => {
      const overflow = list.scrollHeight - viewport.clientHeight
      if (overflow <= 6) {
        setShouldScroll(false)
        setScrollVars({})
        return
      }

      const duration = Math.max(20, 14 + overflow * 0.04)
      setShouldScroll(true)
      setScrollVars({
        ['--kink-social-scroll-distance' as string]: `${overflow}px`,
        ['--kink-social-scroll-duration' as string]: `${duration}s`,
      })
    }

    syncScroll()
    const observer = new ResizeObserver(syncScroll)
    observer.observe(viewport)
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="kink-frame-courts-broadcast kink-frame-courts-broadcast--on-air kink-frame-courts-broadcast--hold">
      <div className="kink-frame-courts">
        <div className="kink-frame-courts-stack kink-frame-social-players">
          <header className="kink-frame-courts-header">
            <div className="kink-frame-courts-label kink-frame-broadcast-item kink-frame-broadcast-item--0">
              Players
            </div>
            <div className="kink-frame-courts-summary kink-frame-broadcast-item kink-frame-broadcast-item--1">
              {KINK_FRAME_SOCIAL_GAME.playerCount} playing
            </div>
          </header>

          <div ref={viewportRef} className="kink-frame-social-players-viewport">
            <ul
              ref={listRef}
              className={[
                'kink-frame-social-players-list',
                shouldScroll ? 'kink-frame-social-players-list--scroll' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={scrollVars}
            >
              {KINK_FRAME_SOCIAL_PLAYERS.map((player, index) => (
                <li key={player.id}>
                  <article
                    className={[
                      'kink-frame-social-player-card',
                      'kink-frame-broadcast-item',
                      `kink-frame-broadcast-item--${index + 2}`,
                    ].join(' ')}
                  >
                    <PlayerPhoto name={player.name} photoUrl={player.photoUrl} />
                    <span className="kink-frame-social-player-name">{player.name}</span>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
