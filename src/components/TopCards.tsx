import { useState, useEffect } from 'react'
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './Card'

interface CardData {
  id: string
  label: string
  title: string
  shortcut: string
  variant: 'blue' | 'white' | 'red' | 'cta'
  content: {
    dateRange: string
    description: string
    highlights: { label: string; icon: string }[]
    actions: { label: string; icon?: string }[]
  }
}

const cards: CardData[] = [
  {
    id: 'sva',
    label: 'IXD PROFESSOR AT',
    title: 'SCHOOL OF VISUAL ARTS',
    shortcut: '1',
    variant: 'blue',
    content: {
      dateRange: '2020→Present',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
      highlights: [
        { label: "SVA'26", icon: 'SVA' },
        { label: "SVA'25", icon: '🎨' },
        { label: "SVA'24", icon: '🔥' },
        { label: "SVA'23", icon: '✨' },
      ],
      actions: [
        { label: 'GO TO CANVAS LMS', icon: '🎯' },
        { label: 'ABOUT THIS COURSE', icon: '▶' },
      ],
    },
  },
  {
    id: 'squarespace',
    label: 'PRODUCT DESIGNER AT',
    title: 'SQUARESPACE',
    shortcut: '2',
    variant: 'white',
    content: {
      dateRange: '2025→Present',
      description: 'Designing the future of collaborative design tools. Building features that empower millions of designers and teams worldwide.',
      highlights: [
        { label: 'SQUARESPACE I', icon: '🎨' },
      ],
      actions: [
        { label: 'VIEW SQUARESPACE PROFILE', icon: '▶' },
      ],
    },
  },
  {
    id: 'rio',
    label: 'JUNIOR DAD TO',
    title: 'RIO RUI RODRIGUEZ',
    shortcut: '3',
    variant: 'red',
    content: {
      dateRange: '2021→Present',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
      highlights: [
        { label: 'Year 3', icon: '🎂' },
        { label: 'Year 2', icon: '🎈' },
        { label: 'Year 1', icon: '👶' },
      ],
      actions: [
        { label: 'VIEW GALLERY', icon: '▶' },
      ],
    },
  },
  {
    id: 'cta',
    label: 'ADD NEW TITLE',
    title: 'REQUEST A CHAT',
    shortcut: '⌘ K',
    variant: 'cta',
    content: {
      dateRange: '',
      description: 'Want to collaborate? Let\'s connect and discuss how we can work together on your next project.',
      highlights: [],
      actions: [
        { label: 'SCHEDULE A CALL', icon: '📅' },
        { label: 'SEND AN EMAIL', icon: '✉️' },
      ],
    },
  },
]

const variantStyles = {
  blue: {
    bg: 'bg-[#2563eb]',
    text: 'text-white',
    border: 'border-[#1e40af]',
    shortcutBg: 'bg-black/30 border-white/20',
  },
  white: {
    bg: 'bg-[#1a1a2e]',
    text: 'text-white',
    border: 'border-gray-700',
    shortcutBg: 'bg-white/20 border-white/20',
  },
  red: {
    bg: 'bg-[#ef4444]',
    text: 'text-white',
    border: 'border-[#b91c1c]',
    shortcutBg: 'bg-black/30 border-white/20',
  },
  cta: {
    bg: 'bg-white',
    text: 'text-gray-900',
    border: 'border-gray-300',
    shortcutBg: 'bg-gray-100 border-gray-300',
  },
}


function ExpandedCard({ card, onClose }: { card: CardData; onClose: () => void }) {
  const styles = variantStyles[card.variant]
  const bgColor = card.variant === 'white' ? '#1a1a2e' :
                  card.variant === 'blue' ? '#2563eb' :
                  card.variant === 'red' ? '#ef4444' :
                  card.variant === 'cta' ? '#ffffff' : '#1a1a2e'

  return (
    <motion.div
      layoutId={`card-${card.id}`}
      className={`relative flex flex-col rounded-2xl overflow-hidden shadow-2xl backdrop-blur-[12px] ${styles.text}`}
      style={{
        backgroundColor: bgColor,
        width: '340px',
        height: '580px',
        pointerEvents: 'auto',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 35,
      }}
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">
            {card.label}
          </span>
          <button
            onClick={onClose}
            className="text-[10px] font-mono px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
          >
            ESC
          </button>
        </div>

        <h2 className="text-2xl font-black tracking-tight mb-3">
          {card.title}
        </h2>

        {card.content.dateRange && (
          <p className="text-sm font-mono opacity-80 mb-3">
            {card.content.dateRange}
          </p>
        )}

        <p className="text-sm leading-relaxed opacity-80">
          {card.content.description}
        </p>
      </div>

      {/* Highlights */}
      {card.content.highlights.length > 0 && (
        <div className="px-5 py-4 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-4">
            HIGHLIGHTS ON IG STORIES
          </p>
          <div className="flex gap-3">
            {card.content.highlights.map((highlight, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10">
                  <span className="text-lg">{highlight.icon}</span>
                </div>
                <span className="text-[9px] font-mono opacity-60">
                  {highlight.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-5 pt-3 mt-auto space-y-2">
        {card.content.actions.map((action, i) => (
          <button
            key={i}
            className={`w-full py-3 px-5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 transition-all
              ${i === 0
                ? 'bg-white text-gray-900 hover:bg-gray-100'
                : 'bg-white/20 hover:bg-white/30'
              }`}
          >
            {action.icon && <span>{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function CollapsedCard({ card, onClick, isBottomFixed, isFlexible, layoutId }: { card: CardData; onClick: () => void; isBottomFixed?: boolean; isFlexible?: boolean; layoutId?: string }) {
  return (
    <Card
      id={card.id}
      label={card.label}
      title={card.title}
      shortcut={card.shortcut}
      variant={card.variant}
      onClick={onClick}
      isBottomFixed={isBottomFixed}
      isFlexible={isFlexible}
      layoutId={layoutId}
    />
  )
}

export function TopCards({ cardIndices }: { cardIndices?: number[] } = {}) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const closeCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(cardId)
      return newSet
    })
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close all expanded cards
      if (e.key === 'Escape' && expandedCards.size > 0) {
        setExpandedCards(new Set())
        return
      }

      // Number keys 1-3 to toggle cards
      if (e.key === '1') {
        e.preventDefault()
        toggleCard('sva')
      } else if (e.key === '2') {
        e.preventDefault()
        toggleCard('squarespace')
      } else if (e.key === '3') {
        e.preventDefault()
        toggleCard('rio')
      }

      // ⌘+K to toggle CTA card
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleCard('cta')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedCards])

  // Filter cards based on cardIndices prop, or show all if not specified
  const cardsToShow = cardIndices ? cardIndices.map(i => cards[i]).filter(Boolean) : cards
  const topThreeCards = cardsToShow.slice(0, 3)
  const ctaCard = cardsToShow.length > 3 ? cardsToShow[3] : undefined

  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    // Initialize with actual window size on mount
    return typeof window !== 'undefined' ? window.innerWidth > 1080 : true
  })

  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Initialize with actual window size on mount
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  })

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1080)
      setIsMobile(window.innerWidth <= 768)
    }

    // Set correct value immediately on mount
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
          <AnimatePresence mode="popLayout">
            {topThreeCards.map((card) => (
              expandedCards.has(card.id) ? (
                <ExpandedCard
                  key={card.id}
                  card={card}
                  onClose={() => closeCard(card.id)}
                />
              ) : (
                <div
                  key={card.id}
                  style={
                    isMobile
                      ? {
                          flex: '0 0 auto',
                          minWidth: '243px',
                          maxWidth: '243px',
                          width: '243px',
                        }
                      : {
                          flex: '1 1 0%',
                          minWidth: 0,
                        }
                  }
                >
                  <CollapsedCard
                    card={card}
                    onClick={() => toggleCard(card.id)}
                    isFlexible={true}
                  />
                </div>
              )
            ))}
          </AnimatePresence>

          {/* CTA card - Desktop only: inline in same row - OUTSIDE AnimatePresence */}
          {isDesktop && ctaCard && (
            <AnimatePresence mode="popLayout">
              {!expandedCards.has(ctaCard.id) && (
                <div
                  key={ctaCard.id}
                  style={{
                    flex: '1 1 0%',
                    pointerEvents: 'none',
                  }}
                >
                  <CollapsedCard
                    card={ctaCard}
                    onClick={() => toggleCard(ctaCard.id)}
                    isFlexible={true}
                  />
                </div>
              )}
              {expandedCards.has(ctaCard.id) && (
                <ExpandedCard
                  key={ctaCard.id}
                  card={ctaCard}
                  onClose={() => closeCard(ctaCard.id)}
                />
              )}
            </AnimatePresence>
          )}
        </div>

        {/* CTA card - Tablet/Mobile only: fixed bottom full width */}
        <AnimatePresence>
          {!isDesktop && ctaCard && (
            <motion.div
              key="bottom-cta"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="fixed bottom-0 left-0 right-0 padding-responsive z-20"
              style={{
                perspective: '1000px',
              }}
            >
              <AnimatePresence mode="popLayout">
                {!expandedCards.has(ctaCard.id) && (
                  <CollapsedCard
                    key={ctaCard.id}
                    card={ctaCard}
                    onClick={() => toggleCard(ctaCard.id)}
                    isBottomFixed={true}
                  />
                )}
                {expandedCards.has(ctaCard.id) && (
                  <ExpandedCard
                    key={ctaCard.id}
                    card={ctaCard}
                    onClose={() => closeCard(ctaCard.id)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
