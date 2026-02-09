export function SelectedWorksHeader() {
  return (
    <section
      style={{ backgroundColor: '#F9F9F9', paddingBottom: 60 }}
      data-scroll
      data-scroll-section
    >
      <div
        style={{
          paddingLeft: 'calc(1 * var(--col) + 22px)',
          paddingRight: 25,
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
    </section>
  )
}
