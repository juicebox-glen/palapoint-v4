/**
 * GradientWaveDrift — "Ambient Glow" Background
 *
 * Three colour orbs float on slow 24–32 second loops creating
 * an Apple Fitness / Nike-level ambient depth effect.
 *
 * GPU-optimized: only CSS transforms, no repaints.
 */
import './gradient-wave-drift.css'

export default function GradientWaveDrift() {
  return (
    <div className="gwd-root" aria-hidden>
      {/* Blue team orb — left side */}
      <div className="gwd-blob gwd-blob-blue" />
      {/* Pink team orb — right side */}
      <div className="gwd-blob gwd-blob-pink" />
      {/* Subtle center warmth */}
      <div className="gwd-blob gwd-blob-center" />
      {/* Vignette for depth */}
      <div className="gwd-vignette" />
    </div>
  )
}
