import { useId } from 'react'

/* Logo mark LokalChain — dipakai di auth, pemilihan sektor, dan rail desktop. */
export function BrandMark({ size = 36, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const bg = `lc-bg-${uid}`
  const ring = `lc-ring-${uid}`
  const leaf = `lc-leaf-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={`brand-mark ${className}`.trim()}
      role="img"
      aria-label="LokalChain"
    >
      <defs>
        <linearGradient id={bg} x1="16" y1="8" x2="112" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14301f" />
          <stop offset="1" stopColor="#07110b" />
        </linearGradient>
        <linearGradient id={ring} x1="28" y1="20" x2="100" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b9f8cd" />
          <stop offset="1" stopColor="#22b45f" />
        </linearGradient>
        <linearGradient id={leaf} x1="48" y1="46" x2="84" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c3fbd5" />
          <stop offset=".45" stopColor="#5fe38b" />
          <stop offset="1" stopColor="#159447" />
        </linearGradient>
      </defs>

      <rect width="128" height="128" rx="30" fill={`url(#${bg})`} />
      <rect x="1" y="1" width="126" height="126" rx="29" fill="none" stroke="rgba(120, 240, 160, 0.26)" />

      <path
        d="M64 20 100 41v46L64 108 28 87V41Z"
        fill="none"
        stroke={`url(#${ring})`}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="64" cy="20" r="4.2" fill="#8bf0ae" />
      <circle cx="100" cy="87" r="4.2" fill="#8bf0ae" />
      <circle cx="28" cy="41" r="4.2" fill="#8bf0ae" />

      <path
        d="M64 91c-17-8-24-26-18-43 18 1 32 13 36 31-4 7-10 11-18 12Z"
        fill={`url(#${leaf})`}
      />
      <path
        d="M51 82c9-14 18-23 30-30"
        fill="none"
        stroke="#0a1710"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity=".55"
      />

      <circle cx="18" cy="101" r="2.4" fill="#54dd7f" opacity=".55" />
      <circle cx="110" cy="27" r="2.4" fill="#54dd7f" opacity=".55" />
    </svg>
  )
}

export function BrandLockup({ size = 38, sub = 'DSS Platform' }) {
  return (
    <div className="brand-lockup">
      <BrandMark size={size} />
      <div className="brand-lockup-text">
        <span className="brand-lockup-name">LokalChain</span>
        {sub && <span className="brand-lockup-sub">{sub}</span>}
      </div>
    </div>
  )
}
