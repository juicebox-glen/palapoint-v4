import { KinkFrameFeatureCard } from '@/components/layout/KinkFrameFeatureCard'
import { KinkFrameModePanel } from '@/components/layout/KinkFrameModePanel'
import { KinkFrameModeSection } from '@/components/layout/KinkFrameModeSection'

const MATCH_ROWS = [
  { id: '1', label: 'Format', value: 'Best of 3 sets' },
  { id: '2', label: 'Set', value: 'Set 2 · Golden point' },
  { id: '3', label: 'Status', value: 'In progress' },
] as const

/** Showcase — live match hero in the left column. */
export function KinkFrameShowcaseLeftPanel() {
  return (
    <KinkFrameModePanel label="Showcase" summary="Live">
      <KinkFrameFeatureCard />
    </KinkFrameModePanel>
  )
}

/** Showcase — match metadata rows in the right glass column. */
export function KinkFrameShowcaseRightPanel() {
  return (
    <KinkFrameModePanel label="Match" summary="Court 02">
      <KinkFrameModeSection label="Details" broadcastIndex={2}>
        <ul className="kink-frame-mode-panel__list">
          {MATCH_ROWS.map((row, index) => (
            <li
              key={row.id}
              className={[
                'kink-frame-mode-panel__list-item',
                'kink-frame-broadcast-item',
                `kink-frame-broadcast-item--${index + 3}`,
              ].join(' ')}
            >
              <article className="kink-frame-mode-row">
                <span className="kink-frame-mode-row__label">{row.label}</span>
                <span className="kink-frame-mode-row__value">{row.value}</span>
              </article>
            </li>
          ))}
        </ul>
      </KinkFrameModeSection>
    </KinkFrameModePanel>
  )
}
