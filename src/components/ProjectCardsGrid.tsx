import { ProjectCard } from './ProjectCard'

/**
 * Grid-based column-width helper.
 * N columns = N × colWidth + (N-1) × gutter
 * where colWidth = (100vw - 2×25px margin - 11×20px gutter) / 12
 */
const colSpan = (n: number) =>
  `calc(${n} * ((100vw - 50px - 220px) / 12) + ${n - 1} * 20px)`

export function ProjectCardsGrid() {
  return (
    <section
      data-scroll
      data-scroll-section
    >
      {/* 35vh spacer — ensures the video player is ~half scrolled off
          the top of the viewport before the "Selected Works" lockup enters */}
      <div style={{ height: '25vh' }} />

      {/* Positioned container for the staggered card grid */}
      <div
        style={{
          position: 'relative',
          height: 4640,
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
            top: 280,
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
          style={{ position: 'absolute', top: 120, left: 'calc(58.33% + 8px)' }}
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
          style={{ position: 'absolute', top: 1260, left: 25 }}
        >
          <ProjectCard
            width={colSpan(6)}
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
          style={{ position: 'absolute', top: 1920, left: 'calc(58.33% + 7px)' }}
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
          style={{ position: 'absolute', top: 2380, left: 'calc(8.33% + 22px)' }}
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
          style={{ position: 'absolute', top: 3780, left: 'calc(33.33% + 15px)' }}
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
