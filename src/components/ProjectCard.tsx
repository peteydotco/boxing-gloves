import { useState, useCallback, useRef } from 'react'

interface ProjectCardProps {
  width: number | string
  /** CSS aspect-ratio (width / height). E.g. 568/877 for tall cards, 689/508 for wide cards. */
  aspectRatio: number
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
  aspectRatio,
  imageSrc,
  logoSrc,
  logoBgColor,
  title,
  role,
  descriptionBg = '#FDEFEF',
  logoPosition = 'left',
}: ProjectCardProps) {
  // ── Hover effects: cursor spotlight, border spotlight, tilt ──
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  // Border spotlight gradient — bright at cursor, fades outward
  const spotlightGradient = isHovered
    ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,1) 0%, rgba(200,210,230,0.8) 15%, rgba(120,120,130,0.35) 35%, rgba(140,140,150,0.3) 55%, rgba(120,120,130,0.35) 100%)`
    : 'none'

  // Dynamic shadow that repels from cursor — layers from --shadow-project-card
  const computeShadow = useCallback(() => {
    const repelX = isHovered ? (50 - mousePos.x) * 0.8 : 0
    const repelY = isHovered ? (50 - mousePos.y) * 0.5 : 0

    const layers = [
      { y: 409, blur: 115, spread: 0, a: 0.00 },
      { y: 262, blur: 105, spread: 0, a: 0.01 },
      { y: 147, blur: 88,  spread: 0, a: 0.05 },
      { y: 65,  blur: 65,  spread: 0, a: 0.09 },
      { y: 16,  blur: 36,  spread: 0, a: 0.10 },
    ]

    return layers.map(l => {
      const x = Math.round(repelX * (l.y / 409))
      const y = Math.round((l.y + repelY * (l.y / 409)))
      return `${x}px ${y}px ${l.blur}px ${l.spread}px rgba(0,0,0,${l.a.toFixed(2)})`
    }).join(', ')
  }, [isHovered, mousePos.x, mousePos.y])

  const dynamicShadow = computeShadow()

  // Support both numeric and calc() string widths
  const metabarWidth =
    typeof width === 'number' ? width - 40 : `calc(${width} - 40px)`

  return (
    // Outermost: mouse event target
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{ position: 'relative' }}
    >
      {/* Tilt wrapper: perspective + rotateX/Y + slight scale on hover */}
      <div
        style={{
          position: 'relative',
          transform: isHovered
            ? `perspective(1200px) rotateX(${(mousePos.y - 50) * -0.025}deg) rotateY(${(mousePos.x - 50) * 0.025}deg) scale(1.006)`
            : 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)',
          transition: isHovered
            ? 'transform 0.15s ease-out'
            : 'transform 0.45s cubic-bezier(0.33, 1, 0.68, 1)',
        }}
      >
        {/* Card container */}
        <div
          style={{
            width,
            aspectRatio,
            borderRadius: 32,
            border: '1.25px solid rgba(255,255,255,0.24)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: dynamicShadow,
            background: 'radial-gradient(ellipse at center, #3C4569 0%, #2C334A 50%, #1B202A 100%)',
            // Smooth shadow settle on mouse leave
            transition: !isHovered ? 'box-shadow 0.45s cubic-bezier(0.33, 1, 0.68, 1)' : 'none',
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
              data-cursor="morph"
              style={{
                position: 'relative',
                width: 100,
                height: 100,
                borderRadius: 22,
                backgroundColor: logoBgColor,
                border: '1px solid rgba(255,255,255,0.24)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                data-cursor-parallax=""
                src={logoSrc}
                alt=""
                style={{ maxWidth: '60%', maxHeight: '60%', width: 'auto', height: 'auto', objectFit: 'contain' }}
              />
            </div>

            {/* Description pill */}
            <div
              data-cursor="morph"
              style={{
                position: 'relative',
                flex: 1,
                borderRadius: 22,
                backgroundColor: descriptionBg,
                border: '1px solid rgba(255,255,255,0.24)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 30px',
                fontFamily: 'Inter',
                fontWeight: 600,
                color: '#000',
              }}
            >
              <p data-cursor-parallax="" style={{ fontSize: 24, letterSpacing: '-0.48px', lineHeight: 'normal' }}>
                {title}
              </p>
              <p data-cursor-parallax="" style={{ fontSize: 16, letterSpacing: '-0.32px', lineHeight: 'normal', marginTop: 4 }}>
                {role}
              </p>
            </div>
          </div>

          {/* Cursor spotlight — radial gradient following mouse */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 'inherit',
              background: isHovered
                ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 45%, transparent 80%)`
                : 'none',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.4s ease-out',
            }}
          />

        </div>

        {/* Border spotlight — outside overflow:hidden so it covers the full card edge */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 32,
            background: spotlightGradient,
            mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1.5px',
            opacity: isHovered ? 0.6 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        />
      </div>
    </div>
  )
}
