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
        <img
          src="/images/squareone-logo.png"
          alt="Square One"
          className="setup-logo-img"
        />
      </div>
      {rightContent && <div className="setup-header-right">{rightContent}</div>}
    </header>
  )
}
