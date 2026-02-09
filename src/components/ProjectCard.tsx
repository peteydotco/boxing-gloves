interface ProjectCardProps {
  width: number
  height: number
  imageSrc: string
  logoSrc: string
  logoBgColor: string
  title: string
  role: string
  descriptionBg?: string
  /** Whether the logo pill is on the left (default) or right */
  logoPosition?: 'left' | 'right'
}

export function ProjectCard({
  width,
  height,
  imageSrc,
  logoSrc,
  logoBgColor,
  title,
  role,
  descriptionBg = '#FDEFEF',
  logoPosition = 'left',
}: ProjectCardProps) {
  const metabarWidth = width - 40 // 20px padding on each side

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 32,
        border: '1.25px solid rgba(255,255,255,0.24)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'var(--shadow-project-card)',
        background: 'radial-gradient(ellipse at center, #3C4569 0%, #2C334A 50%, #1B202A 100%)',
      }}
    >
      {/* Full-bleed project image */}
      <img
        src={imageSrc}
        alt={title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Bottom gradient overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to top, rgba(27,32,42,0.85) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Metabar */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          width: metabarWidth,
          height: 100,
          display: 'flex',
          gap: 20,
          alignItems: 'stretch',
          flexDirection: logoPosition === 'right' ? 'row-reverse' : 'row',
        }}
      >
        {/* Logo pill */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 22,
            backgroundColor: logoBgColor,
            border: '1px solid rgba(255,255,255,0.24)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={logoSrc}
            alt=""
            style={{ width: '60%', height: '60%', objectFit: 'contain' }}
          />
        </div>

        {/* Description pill */}
        <div
          style={{
            flex: 1,
            borderRadius: 22,
            backgroundColor: descriptionBg,
            border: '1px solid rgba(255,255,255,0.24)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 30px',
            fontFamily: 'Inter',
            fontWeight: 600,
            color: '#000',
          }}
        >
          <p style={{ fontSize: 24, letterSpacing: '-0.48px', lineHeight: 'normal' }}>
            {title}
          </p>
          <p style={{ fontSize: 16, letterSpacing: '-0.32px', lineHeight: 'normal', marginTop: 4 }}>
            {role}
          </p>
        </div>
      </div>
    </div>
  )
}
