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
  compactLabel?: string  // Text shown in sticky compact state
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
  // UI-normalized accent (Level 2 — equal perceived weight across variants)
  uiAccent?: string
  uiAccentHover?: string
  uiAccentActive?: string
}

export type VariantStyles = Record<CardVariant, VariantStyle>

