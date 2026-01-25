import React from 'react'

// Card content types - shared between TopCards and MorphingCard

export interface ExpandedContent {
  roleLabel: string
  dateRange: string
  description: React.ReactNode[]
  highlights?: {
    label: string
    image?: string
    href?: string
  }[]
  reflectionsCard?: {
    title: string
    image: string
    href: string
    previewFrames?: string[] // Array of keyframe images for slideshow preview
    previewVideo?: string // Video file for autoplay thumbnail (webm/mp4)
  }
  nowPlayingCard?: {
    label: string
    songTitle: string
    artist: string
    albumArt: string
    href: string
  }
  actions: {
    label: string
    icon?: 'external' | 'play' | 'calendar' | 'email'
    href?: string
    primary?: boolean
  }[]
}

export interface CardData {
  id: string
  label: string
  title: string
  shortcut: string
  variant: 'blue' | 'white' | 'red' | 'cta'
  expandedContent: ExpandedContent
}

// Scene/3D types - from Scene.tsx

export interface Settings {
  // Ball
  color: string
  metalness: number
  roughness: number
  envMapIntensity: number
  radius: number
  // Physics
  mass: number
  restitution: number
  friction: number
  linearDamping: number
  gravity: number
  springStrength: number
  // String
  stringLength: number
  stringThickness: number
  stringColor: string
  ropeDamping: number
}

export interface ShadowSettings {
  lightX: number
  lightY: number
  lightZ: number
  shadowMapSize: number
  shadowCameraBounds: number
  shadowCameraFar: number
  shadowRadius: number
  shadowBias: number
  shadowOpacity: number
}

// Theme types

export type ThemeMode = 'light' | 'inverted' | 'dark' | 'darkInverted'

export type CardVariant = 'blue' | 'white' | 'red' | 'cta'

export interface VariantStyle {
  bg: string
  textColor: string
  secondaryText: string
  ctaTitleColor?: string
  border: string
  expandedBorder: string
  badgeBg: string
  primaryButtonBg: string
  primaryButtonText: string
  primaryButtonBorder: string
  secondaryButtonBg: string
  secondaryButtonText: string
  secondaryButtonBorder: string
  highlightBorder: string
  highlightShadow: string
  dividerColor: string
}

export type VariantStyles = Record<CardVariant, VariantStyle>

// Stage types for Selected Work section

export interface StageMetadata {
  platforms: string
  accolades: string
  agency: string
}

export interface StageData {
  id: string
  title: string
  role: string
  description: string
  metadata: StageMetadata
  footer: string
  logoSrc: string
  logoBgColor: string
  accentColor: string
  // Optional: rich media background (video, 3D scene, or image)
  backgroundMedia?: {
    type: 'video' | 'image' | '3d'
    src: string
  }
}
