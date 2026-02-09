import { ProjectCard } from './ProjectCard'

export function ProjectCardsGrid() {
  return (
    <section
      style={{
        backgroundColor: '#F9F9F9',
        position: 'relative',
        height: 3455,
        width: '100%',
      }}
      data-scroll
      data-scroll-section
    >
      {/* Card 1: MasterClass MVP — top right */}
      <div style={{ position: 'absolute', top: 0, left: 'calc(58.33% + 8px)' }}>
        <ProjectCard
          width={568}
          height={877}
          imageSrc="/images/proj-masterclass.png"
          logoSrc="/images/logos/masterclass-logo.svg"
          logoBgColor="#EF4562"
          title="MasterClass MVP for iOS"
          role="Experience Design Lead"
        />
      </div>

      {/* Card 2: Squarespace — left */}
      <div style={{ position: 'absolute', top: 815, left: 25 }}>
        <ProjectCard
          width={685}
          height={508}
          imageSrc="/images/proj-squarespace.png"
          logoSrc="/images/logos/squarespace-logo.svg"
          logoBgColor="#0064FF"
          title="Squarespace site builder"
          role="Sr Staff Product Designer"
          logoPosition="right"
        />
      </div>

      {/* Card 3: MasterClass variant — right */}
      <div style={{ position: 'absolute', top: 1770, left: 'calc(58.33% + 7px)' }}>
        <ProjectCard
          width={568}
          height={877}
          imageSrc="/images/proj-masterclass.png"
          logoSrc="/images/logos/masterclass-logo.svg"
          logoBgColor="#EF4562"
          title="MasterClass MVP for iOS"
          role="Experience Design Lead"
        />
      </div>

      {/* Card 4: MasterClass second variant — left column */}
      <div style={{ position: 'absolute', top: 1770, left: 'calc(1 * var(--col) + 22px)' }}>
        <ProjectCard
          width={568}
          height={877}
          imageSrc="/images/proj-masterclass.png"
          logoSrc="/images/logos/masterclass-logo.svg"
          logoBgColor="#EF4562"
          title="MasterClass MVP for iOS"
          role="Experience Design Lead"
        />
      </div>

      {/* Card 5: ShipHero iPad — center-right */}
      <div style={{ position: 'absolute', top: 2834, left: 'calc(33.33% + 15px)' }}>
        <ProjectCard
          width={803}
          height={621}
          imageSrc="/images/proj-masterclass.png"
          logoSrc="/images/logos/shiphero-logo.svg"
          logoBgColor="#3C4569"
          title="ShipHero MVP for iPad"
          role="Product Design Lead"
        />
      </div>
    </section>
  )
}
