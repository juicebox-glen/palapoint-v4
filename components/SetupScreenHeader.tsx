'use client'

/**
 * Shared SQUARE ONE header for staff (control + PIN) and player setup screens.
 */
export default function SetupScreenHeader() {
  return (
    <header className="setup-header">
      <div className="setup-logo-mark">
        <span className="setup-logo-l" />
        <span className="setup-logo-square" />
      </div>
      <h1 className="setup-brand">
        <span className="setup-brand-square">SQUARE</span>
        <span className="setup-brand-one">ONE</span>
      </h1>
    </header>
  )
}
