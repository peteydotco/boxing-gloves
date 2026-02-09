export function LogoMarqueeSection() {
  // Company logos for the marquee rows
  const logos = [
    { src: '/images/logos/critical-mass-frame.svg', alt: 'Critical Mass', width: 303 },
    { src: '/images/logos/fantasy-frame.svg', alt: 'Fantasy', width: 303 },
    { src: '/images/logos/apple-logo.svg', alt: 'Apple', width: 242 },
    { src: '/images/logos/masterclass-pink.svg', alt: 'MasterClass', width: 511 },
    { src: '/images/logos/squarespace-logo.svg', alt: 'Squarespace', width: 363 },
    { src: '/images/logos/unfold-logo.svg', alt: 'Unfold', width: 363 },
    { src: '/images/logos/shiphero-logo.svg', alt: 'ShipHero', width: 363 },
  ]

  const rowHeight = 363

  const LogoRow = ({ offset, direction }: { offset: number; direction: 'left' | 'right' }) => (
    <div
      style={{
        position: 'relative',
        height: rowHeight,
        overflow: 'hidden',
        marginLeft: offset,
      }}
    >
      <div
        className={direction === 'left' ? 'animate-marquee-left-slow' : 'animate-marquee-right-slow'}
        style={{
          display: 'flex',
          gap: 42,
          alignItems: 'center',
          width: 'max-content',
        }}
      >
        {/* Double the logos for seamless loop */}
        {[...logos, ...logos].map((logo, i) => (
          <img
            key={i}
            src={logo.src}
            alt={logo.alt}
            style={{
              height: rowHeight,
              width: logo.width,
              flexShrink: 0,
              opacity: 0.12,
            }}
          />
        ))}
      </div>
    </div>
  )

  return (
    <section
      style={{
        backgroundColor: '#F9F9F9',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 80,
        paddingBottom: 80,
      }}
      data-scroll
      data-scroll-section
    >
      {/* Top gradient scrim — fades from F9F9F9 down */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 223,
          background: 'linear-gradient(to bottom, #F9F9F9 0%, transparent 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Logo rows */}
      <div style={{ position: 'relative' }}>
        <LogoRow offset={-100} direction="left" />
        <LogoRow offset={-630} direction="right" />
        <LogoRow offset={-250} direction="left" />
        <LogoRow offset={-800} direction="right" />
      </div>

      {/* Quote — overlaying the logo rows */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 3,
          width: 685,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'Inter',
            fontSize: 48,
            fontWeight: 600,
            lineHeight: '60px',
            letterSpacing: '-1.32px',
            color: '#0E0E0E',
          }}
        >
          He's made a lot of white people a lot of money.
        </p>
      </div>

      {/* Bottom gradient scrim — fades into E5E5E5 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 223,
          background: 'linear-gradient(to top, #E5E5E5 0%, transparent 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </section>
  )
}
