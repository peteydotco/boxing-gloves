import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CardData {
  id: string
  title: string
  color: string
  content: {
    heading: string
    description: string
    details: string[]
  }
}

const cards: CardData[] = [
  {
    id: 'contact',
    title: 'GET IN TOUCH',
    color: '#3d3d5c',
    content: {
      heading: 'Get In Touch',
      description: 'Ready to collaborate? Let\'s create something meaningful together.',
      details: [
        'hello@petey.co',
        'Brooklyn, NY',
        'Available for select projects',
      ],
    },
  },
  {
    id: 'work',
    title: 'SELECTED WORK',
    color: '#2d2d44',
    content: {
      heading: 'Selected Work',
      description: 'A curated collection of projects spanning interactive design, web experiences, and digital products.',
      details: [
        'Brand identity & visual systems',
        'Interactive web experiences',
        'Product design & development',
      ],
    },
  },
  {
    id: 'about',
    title: 'ABOUT PETEY',
    color: '#1a1a2e',
    content: {
      heading: 'About Petey',
      description: 'Peter Rodriguez is a 3rd-generation Nuyorican designer, proudly Bronx-bred and now playing in Brooklyn.',
      details: [
        'Crafting world-class sites & apps since 1989',
        'Specializing in interactive experiences',
        'Building with heart, from screen to yours',
      ],
    },
  },
]

export function StackedFooter() {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCard) {
        setSelectedCard(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCard])

  const cardHeight = 90
  const stackOffset = 16
  const horizontalOffset = 10
  const totalStackHeight = cardHeight + (cards.length - 1) * stackOffset

  return (
    <>
      <div
        className="relative w-full"
        style={{
          height: `${totalStackHeight + 32}px`,
          paddingLeft: '32px',
          paddingRight: '32px',
          paddingBottom: '16px',
        }}
      >
        {/* Stacked cards - bottom card first, top card last */}
        {cards.map((card, index) => {
          const bottomOffset = index * stackOffset
          const sideOffset = (cards.length - 1 - index) * horizontalOffset

          return (
            <motion.button
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className="absolute rounded-[20px] cursor-pointer border-0 outline-none"
              style={{
                left: `${32 + sideOffset}px`,
                right: `${32 + sideOffset}px`,
                bottom: `${16 + bottomOffset}px`,
                height: `${cardHeight}px`,
                backgroundColor: card.color,
                zIndex: index,
              }}
              whileHover={{
                y: -4,
                transition: { duration: 0.2, ease: 'easeOut' },
              }}
              whileTap={{ scale: 0.98 }}
              layoutId={`card-${card.id}`}
            >
              {/* Only show content on the top card */}
              {index === cards.length - 1 && (
                <div className="w-full h-full flex items-center justify-between px-12">
                  <span className="text-white font-bold text-sm tracking-wider uppercase">
                    ABOUT PETEY
                  </span>
                  <div className="flex items-center">
                    <span className="text-white text-2xl font-black tracking-tight flex items-center">
                      <span className="text-white/60 mr-1">⌐</span>
                      PETEY.CO
                    </span>
                  </div>
                  <span className="text-white font-bold text-sm tracking-wider uppercase">
                    SELECTED WORK
                  </span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedCard && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedCard(null)}
            />

            {/* Modal */}
            <motion.div
              layoutId={`card-${selectedCard.id}`}
              className="fixed z-50 rounded-[24px] overflow-hidden"
              style={{
                backgroundColor: selectedCard.color,
                left: '10%',
                right: '10%',
                top: '15%',
                bottom: '15%',
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="h-full flex flex-col p-12"
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center max-w-2xl">
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-white text-5xl font-black tracking-tight mb-6"
                  >
                    {selectedCard.content.heading}
                  </motion.h2>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/80 text-lg leading-relaxed mb-8"
                  >
                    {selectedCard.content.description}
                  </motion.p>

                  <motion.ul
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-3"
                  >
                    {selectedCard.content.details.map((detail, i) => (
                      <li
                        key={i}
                        className="text-white/60 text-sm font-mono tracking-wide flex items-center gap-3"
                      >
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                        {detail}
                      </li>
                    ))}
                  </motion.ul>
                </div>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-8 border-t border-white/10"
                >
                  <span className="text-white/40 text-xs font-mono tracking-wider uppercase">
                    Press ESC or click outside to close
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
