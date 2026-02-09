export function SmorePeteySection() {
  return (
    <section
      className=""
      style={{ position: 'relative', padding: '80px 0' }}
      data-scroll
      data-scroll-section
    >
      <div
        style={{
          /* 10 of 12 columns: 10 × colWidth + 9 × gutter
             contentArea = 100vw - 50px (2 × 25px margin)
             colWidth = (contentArea - 11 × 20px) / 12
             10 cols = 10 × colWidth + 9 × 20px */
          width: 'calc((10 * ((100vw - 50px - 220px) / 12)) + 9 * 20px)',
          maxWidth: 'calc(100vw - 50px)',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 32,
          boxShadow: 'var(--shadow-project-card)',
          overflow: 'hidden',
          padding: '0 27px 27px',
        }}
      >
        {/* Heading */}
        <p
          style={{
            fontFamily: 'Inter',
            fontSize: 48,
            fontWeight: 600,
            letterSpacing: '-0.96px',
            color: '#0E0E0E',
            textAlign: 'center',
            padding: '62px 0 54px',
          }}
        >
          S'more Petey
        </p>

        {/* Sub-cards */}
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Left: Get to know me */}
          <div
            style={{
              flex: 1,
              height: 595,
              backgroundColor: '#E1E1D9',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <p
              style={{
                fontFamily: 'Inter',
                fontSize: 36,
                fontWeight: 600,
                letterSpacing: '-1.44px',
                color: '#0E0E0E',
                position: 'absolute',
                left: 44,
                top: 41,
              }}
            >
              Get to know me
            </p>
          </div>

          {/* Right: Get in touch */}
          <div
            style={{
              flex: 1,
              height: 595,
              backgroundColor: '#D6EFEE',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <p
              style={{
                fontFamily: 'Inter',
                fontSize: 36,
                fontWeight: 600,
                letterSpacing: '-1.44px',
                color: '#0E0E0E',
                position: 'absolute',
                left: 44,
                top: 41,
              }}
            >
              Get in touch
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
