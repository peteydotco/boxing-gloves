import { motion } from 'framer-motion'
import { PeteLogo } from './PeteLogo'

interface StagesHeaderProps {
  onNavigateToHero: () => void
  onThemeToggle: () => void
  logoFill?: string
}

export function StagesHeader({
  onNavigateToHero,
  onThemeToggle,
  logoFill = '#FFFFFF',
}: StagesHeaderProps) {
  const linkTextStyle: React.CSSProperties = {
    fontFamily: 'GT Pressura Mono',
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '0.36px',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    textDecorationColor: 'rgba(255, 255, 255, 0.3)',
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      {/* Left link - Selected Works */}
      <motion.span
        style={linkTextStyle}
        whileHover={{
          color: 'rgba(255, 255, 255, 1)',
          textDecorationColor: 'rgba(255, 255, 255, 0.6)',
        }}
        onClick={onNavigateToHero}
      >
        SELECTED WORKS
      </motion.span>

      {/* Center logo */}
      <div className="flex items-center justify-center">
        <PeteLogo onClick={onThemeToggle} fill={logoFill} />
      </div>

      {/* Right link - About Petey */}
      <motion.span
        style={linkTextStyle}
        whileHover={{
          color: 'rgba(255, 255, 255, 1)',
          textDecorationColor: 'rgba(255, 255, 255, 0.6)',
        }}
        onClick={() => {
          // TODO: Navigate to About section
          console.log('About Petey clicked')
        }}
      >
        ABOUT PETEY
      </motion.span>
    </motion.header>
  )
}
