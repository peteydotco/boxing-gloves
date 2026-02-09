import { BackgroundMarquee } from './BackgroundMarquee'

export function LogoMarqueeSection() {
  return (
    <section
      className=""
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: '140vh',
      }}
      data-scroll
      data-scroll-section
    >
      {/* Background marquee — same component previously used in hero */}
      <BackgroundMarquee marqueeFill="#DCDCDC" />

      {/* Quote — overlaying the marquee */}
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

    </section>
  )
}
