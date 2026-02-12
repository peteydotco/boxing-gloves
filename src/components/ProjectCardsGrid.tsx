import { ProjectCard } from './ProjectCard'

/**
 * Grid-based column-width helper.
 * N columns = N × colWidth + (N-1) × gutter
 * where colWidth = (100vw - 2×25px margin - 11×20px gutter) / 12
 */
const colSpan = (n: number) =>
  `calc(${n} * ((100vw - 50px - 220px) / 12) + ${n - 1} * 20px)`

/** Compact layout for narrower viewports (≤ 1028px) */
const isCompact = typeof window !== 'undefined' && window.innerWidth <= 1028

export function ProjectCardsGrid() {
  return (
    <section
      data-scroll
      data-scroll-section
    >
      {/* Spacer — ensures the video player is ~half scrolled off
          the top of the viewport before the "Selected Works" lockup enters */}
      <div style={{ height: isCompact ? '6vh' : '15vh' }} />

      {/* Positioned container for the staggered card grid */}
      <div
        style={{
          position: 'relative',
          height: isCompact ? 3080 : 3680,
          width: '100%',
        }}
      >
        {/* ===== Selected Works headline — top-aligned so it appears sooner ===== */}
        <div
          className="scroll-fade-in"
          data-scroll
          data-scroll-speed="-0.05"
          style={{
            position: 'absolute',
            top: isCompact ? 80 : 220,
            left: 'calc(1 * var(--col) + 22px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}
        >
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.96px',
              color: '#0E0E0E',
              marginBottom: 36,
            }}
          >
            Selected works
          </p>
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: 48,
              fontWeight: 600,
              letterSpacing: '-1.92px',
              color: '#0E0E0E',
              lineHeight: 'normal',
              maxWidth: 403,
            }}
          >
            Real eyes{' '}
            <br />
            realize real UI's.
          </p>
        </div>

        {/* Card 1: MasterClass MVP — top right (5 cols wide) */}
        <div
          className="scroll-fade-in"
          data-scroll
          data-scroll-repeat
          style={{ position: 'absolute', top: isCompact ? 0 : 80, left: 'calc(58.33% + 8px)' }}
        >
          <ProjectCard
            width={colSpan(5)}
            aspectRatio={568 / 877}
            imageSrc="/images/proj-masterclass.webp"
            logoSrc="/images/logos/masterclass-pink.svg"
            logoBgColor="#EF4562"
            title="MasterClass MVP for iOS"
            role="Experience Design Lead"
          />
        </div>

        {/* Card 2: Squarespace — left (6 cols wide) */}
        <div
          className="scroll-fade-in"
          data-scroll
          data-scroll-repeat
          style={{ position: 'absolute', top: isCompact ? 620 : 1020, left: 25 }}
        >
          <ProjectCard
            width={colSpan(7)}
            aspectRatio={689 / 508}
            imageSrc="/images/proj-squarespace.webp"
            logoSrc="/images/logos/squarespace-logo.svg"
            logoBgColor="#0E0E0E"
            title="Squarespace site builder"
            role="Sr Staff Product Designer"
            logoPosition="right"
            descriptionBg="#FAFAFA"
          />
        </div>

        {/* Card 3: MasterClass variant — right (5 cols wide, staggered above Card 4) */}
        <div
          className="scroll-fade-in"
          data-scroll
          data-scroll-repeat
          style={{ position: 'absolute', top: isCompact ? 1180 : 1580, left: 'calc(58.33% + 7px)' }}
        >
          <ProjectCard
            width={colSpan(5)}
            aspectRatio={568 / 877}
            imageSrc="/images/proj-masterclass.webp"
            logoSrc="/images/logos/masterclass-pink.svg"
            logoBgColor="#EF4562"
            title="MasterClass MVP for iOS"
            role="Experience Design Lead"
          />
        </div>

        {/* Card 4: MasterClass second variant — left column (5 cols wide) */}
        <div
          className="scroll-fade-in"
          data-scroll
          data-scroll-repeat
          style={{ position: 'absolute', top: isCompact ? 1640 : 2040, left: 'calc(8.33% + 22px)' }}
        >
          <ProjectCard
            width={colSpan(5)}
            aspectRatio={568 / 877}
            imageSrc="/images/proj-masterclass.webp"
            logoSrc="/images/logos/masterclass-pink.svg"
            logoBgColor="#EF4562"
            title="MasterClass MVP for iOS"
            role="Experience Design Lead"
          />
        </div>

        {/* Card 5: ShipHero iPad — center-right (7 cols wide) */}
        <div
          className="scroll-fade-in"
          data-scroll
          data-scroll-repeat
          style={{ position: 'absolute', top: isCompact ? 2460 : 3060, left: 'calc(33.33% + 15px)' }}
        >
          <ProjectCard
            width={colSpan(7)}
            aspectRatio={689 / 508}
            imageSrc="/images/proj-masterclass.webp"
            logoSrc="/images/logos/shiphero-logo.svg"
            logoBgColor="#F34242"
            title="ShipHero MVP for iPad"
            role="Product Design Lead"
          />
        </div>
      </div>
    </section>
  )
}
