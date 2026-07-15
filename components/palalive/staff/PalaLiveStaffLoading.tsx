interface PalaLiveStaffLoadingProps {
  message?: string
}

export function PalaLiveStaffLoading({ message = 'Loading…' }: PalaLiveStaffLoadingProps) {
  return (
    <div className="palalive-staff-loading">
      <span className="palalive-staff-spinner" />
      <span className="palalive-staff-loading-text">{message}</span>
    </div>
  )
}
