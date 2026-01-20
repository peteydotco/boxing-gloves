import * as React from 'react'
import { Card } from './Card'

interface CardData {
  id: string
  label: string
  title: string
  shortcut: string
  variant: 'blue' | 'white' | 'red' | 'cta'
}

const cards: CardData[] = [
  {
    id: 'sva',
    label: 'ADJUNCT PROFESSOR FOR',
    title: 'SCHOOL OF VISUAL ARTS',
    shortcut: '1',
    variant: 'blue',
  },
  {
    id: 'squarespace',
    label: 'STAFF DESIGNER WITH',
    title: 'SQUARESPACE',
    shortcut: '2',
    variant: 'white',
  },
  {
    id: 'rio',
    label: 'JUNIOR DAD TO',
    title: 'RIO RUI RODRIGUEZ',
    shortcut: '3',
    variant: 'red',
  },
  {
    id: 'cta',
    label: '< EMPTY >',
    title: 'ADD NEW TITLE',
    shortcut: '⌘ K',
    variant: 'cta',
  },
]

function CollapsedCard({ card, onClick, isBottomFixed, isFlexible, hideShortcut, compactCta, mobileLabel }: { card: CardData; onClick?: () => void; isBottomFixed?: boolean; isFlexible?: boolean; hideShortcut?: boolean; compactCta?: boolean; mobileLabel?: string }) {
  return (
    <Card
      id={card.id}
      label={mobileLabel || card.label}
      title={card.title}
      shortcut={card.shortcut}
      variant={card.variant}
      onClick={onClick}
      isBottomFixed={isBottomFixed}
      isFlexible={isFlexible}
      hideShortcut={hideShortcut}
      compactCta={compactCta}
    />
  )
}

export function TopCards({ cardIndices }: { cardIndices?: number[] } = {}) {
  // Desktop (>=1024px): all 4 cards in top row
  // Tablet (768-1024px): 3 cards top, CTA fixed bottom
  // Mobile (<768px): CTA in top row with 3 cards
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  })

  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false
  })

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Filter cards based on cardIndices prop, or show all if not specified
  const cardsToShow = cardIndices ? cardIndices.map(i => cards[i]).filter(Boolean) : cards
  const topThreeCards = cardsToShow.slice(0, 3)
  const ctaCard = cardsToShow.length > 3 ? cardsToShow[3] : undefined

  // On mobile, put CTA card first in the row; on desktop/tablet, keep original order
  const mobileCards = ctaCard ? [ctaCard, ...topThreeCards] : topThreeCards

  // Check if we're showing a subset (split mode)
  const isSplitMode = cardIndices && cardIndices.length < cards.length

  return (
    <div className={isSplitMode ? "top-padding-responsive" : "horizontal-padding-responsive top-padding-responsive"}>
      <div className="mx-auto" style={{ pointerEvents: 'auto' }}>
        {/* All four cards - Desktop: single row centered, Tablet/Mobile: 3 cards flexing to fit */}
        <div
          className="flex scrollbar-hide"
          style={{
            perspective: '1000px',
            gap: isDesktop ? '1rem' : '0.5rem',
            justifyContent: isMobile ? 'flex-start' : 'center',
            overflowX: isMobile ? 'auto' : 'visible',
            transition: 'gap 0.3s ease, justify-content 0.3s ease, margin 0.3s ease, padding 0.3s ease',
            pointerEvents: 'auto',
            ...(isMobile && {
              marginLeft: '-0.75rem',
              marginRight: '-0.75rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
            }),
          }}
        >
          {(isMobile ? mobileCards : topThreeCards).map((card) => {
            const isCtaCard = card.variant === 'cta'
            const isMobileCtaCard = isMobile && isCtaCard
            return (
              <div
                key={card.id}
                style={
                  isMobile
                    ? {
                        flex: '0 0 auto',
                        minWidth: isMobileCtaCard ? '115px' : '243px',
                        maxWidth: isMobileCtaCard ? '115px' : '243px',
                        width: isMobileCtaCard ? '115px' : '243px',
                      }
                    : {
                        flex: '1 1 0%',
                        minWidth: 0,
                      }
                }
              >
                <CollapsedCard
                  card={card}
                  isFlexible={true}
                  hideShortcut={isMobile}
                  compactCta={isMobileCtaCard}
                  mobileLabel={isMobileCtaCard ? 'ADD A TITLE' : undefined}
                />
              </div>
            )
          })}

          {/* CTA card - XL Desktop only: inline in same row */}
          {isDesktop && ctaCard && (
            <div
              style={{
                flex: '1 1 0%',
                pointerEvents: 'none',
              }}
            >
              <CollapsedCard
                card={ctaCard}
                isFlexible={true}
              />
            </div>
          )}
        </div>

        {/* CTA card - Desktop/Tablet only: fixed bottom full width (mobile has CTA in top row) */}
        {!isDesktop && !isMobile && ctaCard && (
          <div
            className="fixed bottom-0 left-0 right-0 padding-responsive z-20"
            style={{
              perspective: '1000px',
            }}
          >
            <CollapsedCard
              card={ctaCard}
              isBottomFixed={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
