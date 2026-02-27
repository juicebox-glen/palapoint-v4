'use client'

/**
 * Shared SQUARE ONE header for staff (control + PIN) and player setup screens.
 * When rightContent is provided, uses spread layout (logo left, content right).
 */
export default function SetupScreenHeader({
  rightContent,
}: {
  rightContent?: React.ReactNode
}) {
  return (
    <header className={`setup-header ${rightContent ? 'setup-header--spread' : ''}`}>
      <div className="setup-header-left">
        <div className="setup-logo-mark">
          <span className="setup-logo-l" />
          <span className="setup-logo-square" />
        </div>
        <h1 className="setup-brand">
          <span className="setup-brand-square">SQUARE</span>
          <span className="setup-brand-one">ONE</span>
        </h1>
      </div>
      {rightContent && <div className="setup-header-right">{rightContent}</div>}
    </header>
  )
}
