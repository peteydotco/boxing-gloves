export function BioCopySection() {
  return (
    <section
      style={{ backgroundColor: '#F9F9F9' }}
      data-scroll
      data-scroll-section
    >
      <div
        style={{
          maxWidth: 1155,
          paddingLeft: 'calc(1 * var(--col) + 22px)',
          paddingRight: 25,
          paddingTop: 0,
          paddingBottom: 120,
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
            whiteSpace: 'pre-wrap',
          }}
        >
          {'           Peter Evan Rodriguez is a Nuyorican designer solving hard problems with soft product. He brings over a decade of insight, intuition and influence from his dome to your chrome. Nowadays he\u2019s shaping product design for Squarespace\u2019s flagship website builder with user-centered AI tools.'}
        </p>
      </div>
    </section>
  )
}
