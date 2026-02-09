import { Scene, mousePositionRef } from './components/Scene'
import { TopCards } from './components/TopCards'
import { VideoMorphSection } from './components/VideoMorphSection'
import { BioCopySection } from './components/BioCopySection'
import { SelectedWorksHeader } from './components/SelectedWorksHeader'
import { ProjectCardsGrid } from './components/ProjectCardsGrid'
import { LogoMarqueeSection } from './components/LogoMarqueeSection'
import { SmorePeteySection } from './components/SmorePeteySection'
import { SiteFooter } from './components/SiteFooter'
import { useState, useEffect, useRef, useCallback } from 'react'
import LocomotiveScroll from 'locomotive-scroll'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  })

  const themeMode = 'light' as const

  // Debug grid overlay — toggle with "G" key
  const [showGrid, setShowGrid] = useState(false)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === 'g' || e.key === 'G') setShowGrid(prev => !prev)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      mousePositionRef.current = { x, y }
    }

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Initialize Locomotive Scroll (smooth scrolling + data-scroll detection)
  useEffect(() => {
    const scroll = new LocomotiveScroll({
      lenisOptions: {
        lerp: 0.09,
        duration: 1.3,
        smoothWheel: true,
        syncTouch: false,
      },
    })

    return () => scroll.destroy()
  }, [])

  // Hardcoded shadow settings
  const shadowSettings = {
    lightX: 0,
    lightY: 2.5,
    lightZ: 10,
    shadowMapSize: 2048,
    shadowCameraBounds: 8,
    shadowCameraFar: 30,
    shadowRadius: 4,
    shadowBias: -0.0001,
    shadowOpacity: 0.08,
  }

  // Boxing Gloves preset - hardcoded
  const settings = {
    color: '#8b0000',
    metalness: 0.1,
    roughness: 0.6,
    envMapIntensity: 0.4,
    radius: 0.525,
    mass: 1.2,
    restitution: 0.02,
    friction: 0.8,
    linearDamping: 1.0,
    gravity: -200,
    springStrength: 350,
    stringLength: 2.5,
    stringThickness: 0.028,
    stringColor: '#d4a574',
    ropeDamping: 0.92,
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen flex flex-col"
    >
      {/* Global grain texture — FIRST child so content paints on top */}
      <div className="grain-overlay" />

      {/* ===== Hero Section ===== */}
      <section className="relative h-screen w-full flex-shrink-0">
        {/* Graffiti tag background image */}
        <div
          className="absolute pointer-events-none"
          style={{ top: '-15%', bottom: '-15%', left: '-7.5%', right: '-7.5%', opacity: 0.10, zIndex: 1, transform: 'scale(1.2)', transformOrigin: 'center bottom' }}
        >
          <img
            src="/images/graffiti-tag.png"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center -50%',
              display: 'block',
            }}
          />
{/* mix-blend-difference overlay removed — was causing hero/bio seam */}
        </div>

        {/* Desktop: 3D Scene */}
        {isDesktop && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 10, pointerEvents: 'auto' }}
          >
            <Scene settings={settings} shadowSettings={shadowSettings} themeMode={themeMode} />
          </div>
        )}

        {/* Desktop: TopCards */}
        {isDesktop && (
          <div
            className="absolute top-0 left-0 right-0"
            style={{ pointerEvents: 'auto', overflow: 'visible', zIndex: 20 }}
          >
            <TopCards themeMode={themeMode} />
          </div>
        )}

        {/* Mobile/Tablet: TopCards + 3D Scene inside hero */}
        {!isDesktop && (
          <>
            <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
              <TopCards themeMode={themeMode} />
            </div>
            <div
              className="absolute inset-0"
              style={{ zIndex: 10, pointerEvents: 'auto' }}
            >
              <Scene settings={settings} shadowSettings={shadowSettings} themeMode={themeMode} />
            </div>
          </>
        )}

      </section>

      {/* ===== Bio Copy Section ===== */}
      <BioCopySection />

      {/* ===== Video Morph Section ===== */}
      <VideoMorphSection />

      {/* ===== Selected Works Header ===== */}
      <SelectedWorksHeader />

      {/* ===== Project Cards Grid ===== */}
      <ProjectCardsGrid />

      {/* ===== Logo Marquee + Quote ===== */}
      <LogoMarqueeSection />

      {/* ===== S'more Petey ===== */}
      <SmorePeteySection />

      {/* ===== Footer ===== */}
      <SiteFooter />

      {/* Debug grid overlay — toggled with G key (Figma: 12 cols, 25px margin, 20px gutter) */}
      {showGrid && (
        <div
          className="debug-grid-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            pointerEvents: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 20,
            padding: '0 25px',
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.04)',
                height: '100%',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default App
