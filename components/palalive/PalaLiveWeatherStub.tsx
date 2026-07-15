/** Visual stub only — hardcoded partly-cloudy icon, no weather API this phase (Phase 5). */
export function PalaLiveWeatherStub() {
  return (
    <span className="palalive-weather-icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="var(--weather-sun)" strokeWidth="3" strokeLinecap="round">
          <line x1="46" y1="7" x2="46" y2="3" />
          <line x1="58" y1="17" x2="61" y2="14" />
          <line x1="34" y1="17" x2="31" y2="14" />
          <line x1="61" y1="29" x2="65" y2="29" />
        </g>
        <circle cx="46" cy="19" r="10" fill="var(--weather-sun)" />
        <path
          d="M20 44c-6 0-11-4.9-11-11 0-5.7 4.3-10.4 9.8-10.9C19.6 15.7 25.5 11 32 11c7 0 12.8 5.2 13.7 12 5.6.6 9.8 5.3 9.8 11 0 6.1-4.9 11-11 11H20z"
          fill="var(--card)"
          stroke="var(--weather-cloud)"
          strokeWidth="2.5"
        />
      </svg>
    </span>
  )
}
