import { useId, type ReactNode } from 'react'

type VetHeroPatternProps = {
  className?: string
  variant?: 'hero' | 'corner'
}

type IconProps = {
  x: number
  y: number
  scale?: number
  rotate?: number
  opacity?: number
  children: ReactNode
}

function PatternIcon({
  x,
  y,
  scale = 1,
  rotate = 0,
  opacity = 1,
  children,
}: IconProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`} opacity={opacity}>
      {children}
    </g>
  )
}

function ClipboardIcon() {
  return (
    <>
      <rect x="10" y="9" width="28" height="34" rx="5" />
      <path d="M19 9h10a3 3 0 0 1 3 3v2H16v-2a3 3 0 0 1 3-3Z" />
      <path d="M16 22h16M16 29h12M16 36h9" />
    </>
  )
}

function FlaskIcon() {
  return (
    <>
      <path d="M18 8h12" />
      <path d="M22 8v9l-9 15a6 6 0 0 0 5 9h12a6 6 0 0 0 5-9l-9-15V8" />
      <path d="M17 28h18" />
    </>
  )
}

function StethoscopeIcon() {
  return (
    <>
      <path d="M14 8v10c0 6 4 10 10 10s10-4 10-10V8" />
      <path d="M11 8v6M37 8v6" />
      <path d="M24 28v7a7 7 0 0 0 7 7h3" />
      <circle cx="38" cy="42" r="4" />
      <circle cx="11" cy="8" r="2.5" />
      <circle cx="37" cy="8" r="2.5" />
    </>
  )
}

function SyringeIcon() {
  return (
    <>
      <path d="M13 33 33 13" />
      <path d="M29 9 37 17" />
      <path d="M25 17 33 25" />
      <path d="M10 36l6 6" />
      <path d="M18 28l8 8" />
      <path d="M34 8h7M40 8v7" />
    </>
  )
}

function MicroscopeIcon() {
  return (
    <>
      <path d="M18 38h24" />
      <path d="M24 14 34 24" />
      <path d="M28 12 19 21a5 5 0 0 0 0 7l2 2" />
      <path d="M35 25v4a9 9 0 0 1-9 9h-6" />
      <path d="M20 38v-7" />
      <path d="M15 30h13" />
    </>
  )
}

function VetCrossIcon() {
  return (
    <>
      <rect x="10" y="10" width="28" height="28" rx="8" />
      <path d="M24 16v16M16 24h16" />
    </>
  )
}

export default function VetHeroPattern({
  className = '',
  variant = 'hero',
}: VetHeroPatternProps) {
  const heroTintId = useId().replace(/:/g, '')
  const cornerTintId = useId().replace(/:/g, '')
  const sharedStroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      style={{ color: 'rgb(var(--text-secondary-rgb) / 0.26)' }}
    >
      {variant === 'hero' ? (
        <svg
          viewBox="0 0 1200 360"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id={heroTintId} cx="76%" cy="28%" r="52%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="980" cy="94" r="180" fill={`url(#${heroTintId})`} />
          <circle cx="1115" cy="284" r="176" fill="var(--danger)" opacity="0.05" />
          <path
            d="M742 318c88-92 225-114 366-54"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.16"
          />
          <circle
            cx="944"
            cy="188"
            r="122"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeDasharray="5 8"
            opacity="0.13"
            fill="none"
          />

          <text
            x="822"
            y="176"
            fontSize="176"
            fontWeight="800"
            fill="var(--primary)"
            opacity="0.12"
          >
            V
          </text>
          <text
            x="970"
            y="212"
            fontSize="138"
            fontWeight="800"
            fill="var(--danger)"
            opacity="0.08"
          >
            F
          </text>

          <g strokeWidth="1.8" {...sharedStroke}>
            <PatternIcon x={756} y={58} scale={1.18} opacity={0.72}>
              <FlaskIcon />
            </PatternIcon>
            <PatternIcon x={1068} y={54} scale={1.1} opacity={0.62}>
              <VetCrossIcon />
            </PatternIcon>
            <PatternIcon x={944} y={70} scale={1.12} opacity={0.76}>
              <StethoscopeIcon />
            </PatternIcon>
            <PatternIcon x={1030} y={214} scale={1.08} rotate={-8} opacity={0.68}>
              <SyringeIcon />
            </PatternIcon>
            <PatternIcon x={818} y={238} scale={1.08} opacity={0.74}>
              <ClipboardIcon />
            </PatternIcon>
            <PatternIcon x={1104} y={196} scale={1.16} opacity={0.6}>
              <MicroscopeIcon />
            </PatternIcon>
          </g>
        </svg>
      ) : (
        <svg
          viewBox="0 0 320 200"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id={cornerTintId} cx="74%" cy="30%" r="56%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.11" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="234" cy="68" r="86" fill={`url(#${cornerTintId})`} />
          <circle cx="286" cy="164" r="76" fill="var(--danger)" opacity="0.045" />
          <circle
            cx="230"
            cy="108"
            r="68"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeDasharray="4 7"
            opacity="0.14"
            fill="none"
          />

          <text
            x="170"
            y="96"
            fontSize="78"
            fontWeight="800"
            fill="var(--primary)"
            opacity="0.12"
          >
            V
          </text>
          <text
            x="235"
            y="114"
            fontSize="60"
            fontWeight="800"
            fill="var(--danger)"
            opacity="0.08"
          >
            F
          </text>

          <g strokeWidth="1.6" {...sharedStroke}>
            <PatternIcon x={150} y={24} scale={0.72} opacity={0.66}>
              <FlaskIcon />
            </PatternIcon>
            <PatternIcon x={250} y={20} scale={0.68} opacity={0.58}>
              <VetCrossIcon />
            </PatternIcon>
            <PatternIcon x={206} y={40} scale={0.72} opacity={0.72}>
              <StethoscopeIcon />
            </PatternIcon>
            <PatternIcon x={232} y={122} scale={0.7} rotate={-8} opacity={0.64}>
              <SyringeIcon />
            </PatternIcon>
            <PatternIcon x={160} y={128} scale={0.7} opacity={0.66}>
              <ClipboardIcon />
            </PatternIcon>
            <PatternIcon x={262} y={108} scale={0.72} opacity={0.58}>
              <MicroscopeIcon />
            </PatternIcon>
          </g>
        </svg>
      )}
    </div>
  )
}
