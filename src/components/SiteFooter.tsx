export function SiteFooter() {
  return (
    <footer
      style={{
        backgroundColor: '#E5E5E5',
        padding: '0 25px 40px',
      }}
      data-scroll
      data-scroll-section
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Copyright pill */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9999,
            border: '2.7px solid #0E0E0E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 600,
            color: '#0E0E0E',
          }}
        >
          C
        </div>

        {/* Year pill */}
        <div
          style={{
            height: 36,
            borderRadius: 9999,
            backgroundColor: '#0E0E0E',
            border: '2.7px solid #0E0E0E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 600,
            color: '#FFFFFF',
          }}
        >
          2026
        </div>

        {/* PETEY.CO pill */}
        <div
          style={{
            height: 36,
            borderRadius: 9999,
            border: '2.7px solid #0E0E0E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            fontFamily: 'Inter',
            fontSize: 21,
            fontWeight: 700,
            color: '#0E0E0E',
            letterSpacing: '-0.85px',
          }}
        >
          PETEY.CO
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'GT Pressura',
            fontSize: 15.6,
            fontWeight: 500,
            color: '#0E0E0E',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Curious. Charitable. Contrarian.
        </p>

        {/* Petey graffiti logo */}
        <img
          src="/images/petey-graffiti.png"
          alt="Petey"
          style={{
            height: 47,
            width: 'auto',
            mixBlendMode: 'darken',
          }}
        />

        {/* Made in NY badge */}
        <img
          src="/images/made-in-ny.svg"
          alt="Made in NY"
          style={{
            width: 47,
            height: 47,
          }}
        />

        {/* Crosshair icon */}
        <svg
          width="47"
          height="47"
          viewBox="0 0 47 47"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          {/* Outer circle */}
          <rect
            x="8.21"
            y="8"
            width="30"
            height="30"
            rx="15"
            stroke="#0E0E0E"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Vertical crosshair */}
          <line x1="23.5" y1="0" x2="23.5" y2="47" stroke="#0E0E0E" strokeWidth="1.5" />
          {/* Horizontal crosshair */}
          <line x1="0" y1="23.5" x2="47" y2="23.5" stroke="#0E0E0E" strokeWidth="1.5" />
        </svg>
      </div>
    </footer>
  )
}
