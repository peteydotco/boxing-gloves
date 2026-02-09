export function SiteFooter() {
  return (
    <footer
      className=""
      style={{
        position: 'relative',
        padding: '0 0 40px',
      }}
      data-scroll
      data-scroll-section
    >
      <div
        style={{
          /* 10 of 12 columns, centered */
          width: 'calc((10 * ((100vw - 50px - 220px) / 12)) + 9 * 20px)',
          maxWidth: 'calc(100vw - 50px)',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          flexWrap: 'nowrap',
        }}
      >
        {/* ===== Pills group: © 2026 PETEY.CO ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
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
              fontSize: 21,
              fontWeight: 700,
              color: '#0E0E0E',
              letterSpacing: '-0.85px',
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
              fontSize: 21,
              fontWeight: 600,
              color: '#F3F3F3',
              letterSpacing: '-0.85px',
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
        </div>

        {/* ===== Spacer ===== */}
        <div style={{ flex: 1 }} />

        {/* ===== Tagline ===== */}
        <div
          style={{
            fontFamily: 'GT Pressura',
            fontSize: 15.6,
            fontWeight: 500,
            color: '#0E0E0E',
            textTransform: 'uppercase' as const,
            letterSpacing: '-0.625px',
            textAlign: 'center' as const,
            lineHeight: '15.6px',
            flexShrink: 0,
          }}
        >
          <div>Curious.</div>
          <div>Charitable.</div>
          <div>Contrarian.</div>
        </div>

        {/* ===== Spacer ===== */}
        <div style={{ flex: 1 }} />

        {/* ===== Petey graffiti logo ===== */}
        <img
          src="/images/petey-graffiti.png"
          alt="Petey"
          style={{
            height: 52,
            width: 'auto',
            mixBlendMode: 'darken',
            flexShrink: 0,
          }}
        />

        {/* ===== Spacer ===== */}
        <div style={{ flex: 1 }} />

        {/* ===== Made in NY badge ===== */}
        <img
          src="/images/made-in-ny-badge.png"
          alt="Made in NY"
          style={{
            width: 56,
            height: 56,
            flexShrink: 0,
          }}
        />

        {/* ===== Spacer ===== */}
        <div style={{ flex: 1 }} />

        {/* ===== Crosshair icon ===== */}
        <img
          src="/images/crosshair.svg"
          alt=""
          style={{
            width: 47,
            height: 47,
            flexShrink: 0,
          }}
        />
      </div>
    </footer>
  )
}
