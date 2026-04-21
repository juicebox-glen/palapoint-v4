/**
 * Short horizontal separator between two scores (replaces a typed dash).
 * Styling (color / opacity) comes from the optional `className` on the wrapper.
 */
export function ScoreSepBar({ className }: { className?: string }) {
  return (
    <span className={['score-sep-wrap', className].filter(Boolean).join(' ')} aria-hidden>
      <span className="score-sep-bar" />
    </span>
  )
}
