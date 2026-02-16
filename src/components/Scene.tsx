import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect, useRef, useState } from 'react'
import { HangingSpheres } from './HangingSpheres'
import * as THREE from 'three'
import type { Settings, ShadowSettings, ThemeMode } from '../types'

// Global ref for mouse position - updated by App.tsx, read by Scene internals
// This avoids React re-renders when mouse moves
export const mousePositionRef = { current: { x: 0.5, y: 0.5 } }

// Re-export Settings type for backwards compatibility
export type { Settings, ShadowSettings } from '../types'

function ShadowMapUpdater() {
  const { gl } = useThree()

  useEffect(() => {
    // Force shadow map regeneration for VSM to prevent artifacts
    if (gl.shadowMap.enabled) {
      gl.shadowMap.needsUpdate = true
    }
  }, [gl])

  return null
}

// Hook to detect pause events and control physics
function usePhysicsPauseDetection() {
  const [isPaused, setIsPaused] = useState(false)
  const lastTime = useRef(performance.now())
  const pauseTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const checkForPause = () => {
      const now = performance.now()
      const elapsed = now - lastTime.current
      lastTime.current = now

      // If more than 100ms elapsed, pause physics briefly
      if (elapsed > 100) {
        setIsPaused(true)
        // Resume after a short delay to let things stabilize
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current)
        }
        pauseTimeoutRef.current = window.setTimeout(() => {
          setIsPaused(false)
        }, 50)
      }

      requestAnimationFrame(checkForPause)
    }

    const rafId = requestAnimationFrame(checkForPause)

    // Also pause on visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true)
      } else {
        // Resume after a delay when becoming visible
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current)
        }
        pauseTimeoutRef.current = window.setTimeout(() => {
          setIsPaused(false)
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  return isPaused
}

// Wrapper component that handles physics with pause detection
function PhysicsWithPauseDetection({ children }: { children: React.ReactNode }) {
  const isPaused = usePhysicsPauseDetection()

  return (
    <Physics
      gravity={[0, -9.81, 0]}
      timeStep={1/60}
      updatePriority={-50}
      paused={isPaused}
      interpolate={true}
    >
      {children}
    </Physics>
  )
}

function Lighting({ lightPos, shadowMapSize, cameraBounds, cameraFar, shadowRadius, shadowBias, isDarkTheme, themeMode, gloveDuskRef }: {
  lightPos: [number, number, number]
  shadowMapSize: [number, number]
  cameraBounds: number
  cameraFar: number
  shadowRadius: number
  shadowBias: number
  isDarkTheme: boolean
  themeMode: ThemeMode
  gloveDuskRef?: React.RefObject<number>
}) {
  const isDarkestTheme = themeMode === 'darkInverted' // Pure black bg needs brighter spotlight
  const { gl } = useThree()
  const mainLightRef = useRef<THREE.DirectionalLight>(null)
  const fillLightRef = useRef<THREE.DirectionalLight>(null)
  const backLightRef = useRef<THREE.DirectionalLight>(null)
  const topLightRef = useRef<THREE.PointLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const spotRef = useRef<THREE.SpotLight>(null)

  // Pre-computed color pairs for dusk interpolation (allocated once, reused every frame)
  const duskColors = useRef({
    mainLight: new THREE.Color('#ffffff'),
    mainDark: new THREE.Color('#1A0A1A'),      // near-black — "dark side" facing viewer
    fillLight: new THREE.Color('#a0c4ff'),
    fillDark: new THREE.Color('#CC6633'),       // warm terra cotta side-spill from sunset behind
    backLight: new THREE.Color('#ffe4b5'),
    backDark: new THREE.Color('#FF9955'),       // bright coral-orange — hero rim light
    topLight: new THREE.Color('#ffffff'),
    topDark: new THREE.Color('#D8A8D8'),        // soft lavender — upper sunset atmosphere
    ambLight: new THREE.Color('#ffffff'),
    ambDark: new THREE.Color('#1A0A1A'),        // near-black — deep shadows, minimal fill
    spotLight: new THREE.Color('#aabbcc'),
    spotDark: new THREE.Color('#FF7744'),       // warm orange backlight
    tmp: new THREE.Color(),
  })

  // Current light position with smooth interpolation
  const currentLightPos = useRef({ x: lightPos[0], y: lightPos[1], z: lightPos[2] })

  // Force shadow map update when parameters change
  useEffect(() => {
    if (gl.shadowMap.enabled) {
      gl.shadowMap.needsUpdate = true
    }
  }, [lightPos, shadowMapSize, cameraBounds, cameraFar, shadowRadius, shadowBias, gl])

  // Smoothly interpolate light position based on mouse
  useFrame(() => {
    if (!mainLightRef.current) return

    // Read mouse position from ref (no React re-renders)
    const mouse = mousePositionRef.current

    // Calculate target light position based on mouse
    // Mouse x: 0-1 maps to light x offset (subtle, ±2 units)
    // Mouse y: 0-1 maps to light y offset (subtle, ±1 unit)
    const lightOffsetX = (mouse.x - 0.5) * 4 // ±2 units
    const lightOffsetY = (mouse.y - 0.5) * -2 // ±1 unit (inverted)

    const targetX = lightPos[0] + lightOffsetX
    const targetY = lightPos[1] + lightOffsetY
    const targetZ = lightPos[2]

    // Smooth interpolation (lerp factor ~0.05 for gentle movement)
    const lerp = 0.05
    currentLightPos.current.x += (targetX - currentLightPos.current.x) * lerp
    currentLightPos.current.y += (targetY - currentLightPos.current.y) * lerp
    currentLightPos.current.z += (targetZ - currentLightPos.current.z) * lerp

    // Update main light position
    mainLightRef.current.position.set(
      currentLightPos.current.x,
      currentLightPos.current.y,
      currentLightPos.current.z
    )

    // Update fill light to complement (opposite side, subtle)
    if (fillLightRef.current) {
      fillLightRef.current.position.set(
        -4 - lightOffsetX * 0.3,
        3 - lightOffsetY * 0.3,
        2
      )
    }
  })

  // Scroll-driven dusk interpolation — reads gloveDuskRef (0→1) each frame
  // and imperatively updates all light intensities and colors.
  // Runs AFTER the mouse-follow useFrame above (declaration order in R3F).
  useFrame(() => {
    const t = gloveDuskRef?.current ?? 0
    if (t === 0) return
    const c = duskColors.current

    // Front light crushes to near-black — "dark side of the moon"
    if (mainLightRef.current) {
      mainLightRef.current.intensity = 3.0 + (0.3 - 3.0) * t
      mainLightRef.current.color.copy(c.tmp.lerpColors(c.mainLight, c.mainDark, t))
    }
    // Side fill dims, picks up warm terra cotta
    if (fillLightRef.current) {
      fillLightRef.current.intensity = 1.5 + (0.4 - 1.5) * t
      fillLightRef.current.color.copy(c.tmp.lerpColors(c.fillLight, c.fillDark, t))
    }
    // Back rim SURGES — bright coral-orange sunset edge
    if (backLightRef.current) {
      backLightRef.current.intensity = 2.0 + (4.0 - 2.0) * t
      backLightRef.current.color.copy(c.tmp.lerpColors(c.backLight, c.backDark, t))
    }
    // Top light drops, shifts to soft lavender
    if (topLightRef.current) {
      topLightRef.current.intensity = 30 + (5 - 30) * t
      topLightRef.current.color.copy(c.tmp.lerpColors(c.topLight, c.topDark, t))
    }
    // Ambient crushes to near-black — deep shadows
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.6 + (0.08 - 0.6) * t
      ambientRef.current.color.copy(c.tmp.lerpColors(c.ambLight, c.ambDark, t))
    }
    // Spotlight: repositions from front to BEHIND gloves, warm orange backlight
    if (spotRef.current) {
      spotRef.current.intensity = 60 * t
      spotRef.current.position.z = 8 + (-6 - 8) * t    // front → behind
      spotRef.current.position.y = 4 + (3 - 4) * t     // slight drop
      spotRef.current.color.copy(c.tmp.lerpColors(c.spotLight, c.spotDark, t))
    }
  })

  // Dark theme: cooler nighttime lighting with spotlight feel
  // Light theme: warm, bright daylight lighting
  const mainIntensity = isDarkTheme ? 2.4 : 3
  const fillIntensity = isDarkTheme ? 1.0 : 1.5
  const fillColor = isDarkTheme ? '#7799dd' : '#a0c4ff' // Cooler blue for night
  const backIntensity = isDarkTheme ? 1.2 : 2
  const backColor = isDarkTheme ? '#5577bb' : '#ffe4b5' // Cool moonlight vs warm sunlight
  const topIntensity = isDarkTheme ? 20 : 30
  const topColor = isDarkTheme ? '#99aacc' : '#ffffff' // Soft blue-gray vs white
  const ambientIntensity = isDarkTheme ? 0.4 : 0.6

  return (
    <>
      {/* Main light from front - creates shadow behind gloves */}
      <directionalLight
        ref={mainLightRef}
        position={lightPos}
        intensity={mainIntensity}
        color={isDarkTheme ? '#aabbdd' : '#ffffff'}
        castShadow
        shadow-mapSize={shadowMapSize}
        shadow-camera-left={-cameraBounds}
        shadow-camera-right={cameraBounds}
        shadow-camera-top={cameraBounds}
        shadow-camera-bottom={-cameraBounds}
        shadow-camera-near={0.5}
        shadow-camera-far={cameraFar}
        shadow-radius={shadowRadius}
        shadow-bias={shadowBias}
      />

      {/* Fill light - from left */}
      <directionalLight
        ref={fillLightRef}
        position={[-4, 3, 2]}
        intensity={fillIntensity}
        color={fillColor}
      />

      {/* Back light - creates rim lighting */}
      <directionalLight
        ref={backLightRef}
        position={[0, 3, -5]}
        intensity={backIntensity}
        color={backColor}
      />

      {/* Top light */}
      <pointLight
        ref={topLightRef}
        position={[0, 6, 0]}
        intensity={topIntensity}
        color={topColor}
      />

      {/* Ambient fill */}
      <ambientLight ref={ambientRef} intensity={ambientIntensity} color={isDarkTheme ? '#778899' : '#ffffff'} />

      {/* Spotlight — always present, fades in via dusk interpolation (intensity 0 at t=0) */}
      <spotLight
        ref={spotRef}
        position={[0, 4, 8]}
        angle={0.6}
        penumbra={0.8}
        intensity={isDarkTheme ? (isDarkestTheme ? 80 : 40) : 0}
        color={isDarkTheme ? (isDarkestTheme ? '#ffffff' : '#aabbcc') : '#aabbcc'}
        target-position={[0, 0, 0]}
      />
    </>
  )
}

// Mouse follow rotation wrapper for the gloves
function MouseFollowGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })

  useFrame((_, rawDelta) => {
    if (!groupRef.current) return
    const delta = Math.min(rawDelta, 0.05)
    const mouse = mousePositionRef.current
    const maxRotation = 0.12 // Increased for more noticeable cursor follow
    targetRotation.current.y = (mouse.x - 0.5) * 2 * maxRotation
    targetRotation.current.x = (mouse.y - 0.5) * -2 * maxRotation * 0.5
    const springStrength = 3
    const damping = 0.85
    const forceX = (targetRotation.current.x - currentRotation.current.x) * springStrength
    const forceY = (targetRotation.current.y - currentRotation.current.y) * springStrength
    velocity.current.x += forceX * delta
    velocity.current.y += forceY * delta
    velocity.current.x *= damping
    velocity.current.y *= damping
    currentRotation.current.x += velocity.current.x
    currentRotation.current.y += velocity.current.y
    groupRef.current.rotation.x = currentRotation.current.x
    groupRef.current.rotation.y = currentRotation.current.y
  })

  return (
    <group ref={groupRef}>
      {children}
    </group>
  )
}

// Scroll-driven scale wrapper — reads a mutable ref each frame for jitter-free interpolation
function ScaleGroup({ children, gloveScaleRef }: { children: React.ReactNode; gloveScaleRef?: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current || !gloveScaleRef?.current) return
    const s = gloveScaleRef.current
    groupRef.current.scale.set(s, s, s)
  })
  return <group ref={groupRef}>{children}</group>
}

// Scroll-driven horizontal translate — zig-zag movement on sub-desktop viewports
function HorizontalTranslateGroup({ children, gloveHorizontalRef }: { children: React.ReactNode; gloveHorizontalRef?: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current || !gloveHorizontalRef) return
    groupRef.current.position.x = gloveHorizontalRef.current
  })
  return <group ref={groupRef}>{children}</group>
}

// Scroll-driven Y-axis rotation — turntable spin mapped to scroll position
function ScrollRotationGroup({ children, gloveRotationRef }: { children: React.ReactNode; gloveRotationRef?: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current || !gloveRotationRef?.current) return
    groupRef.current.rotation.y = gloveRotationRef.current
  })
  return <group ref={groupRef}>{children}</group>
}

// Lightformers inside <Environment> — uses refs + useFrame for dusk interpolation
function DuskLightformers({ isDarkTheme, gloveDuskRef }: { isDarkTheme: boolean; gloveDuskRef?: React.RefObject<number> }) {
  const lf1Ref = useRef<THREE.Mesh>(null)
  const lf2Ref = useRef<THREE.Mesh>(null)
  const lf3Ref = useRef<THREE.Mesh>(null)

  const lfColors = useRef({
    lf1Light: new THREE.Color('#ffffff'),
    lf1Dark: new THREE.Color('#CC6633'),       // burnt terra cotta — warm top reflections
    lf2Light: new THREE.Color('#ffffff'),
    lf2Dark: new THREE.Color('#D8A8D8'),       // soft mauve — purple tint on left
    lf3Light: new THREE.Color('#ffd700'),
    lf3Dark: new THREE.Color('#FF9955'),       // coral-orange (gold → warm sunset)
    tmp: new THREE.Color(),
  })

  useFrame(() => {
    const t = gloveDuskRef?.current ?? 0
    if (t === 0) return
    const c = lfColors.current

    if (lf1Ref.current) {
      const mat = (lf1Ref.current as unknown as { material: THREE.MeshBasicMaterial }).material
      mat.color.copy(c.tmp.lerpColors(c.lf1Light, c.lf1Dark, t))
      const intensity = 4.0 + (1.5 - 4.0) * t     // 4.0 → 1.5
      mat.color.multiplyScalar(intensity / 4.0)
    }
    if (lf2Ref.current) {
      const mat = (lf2Ref.current as unknown as { material: THREE.MeshBasicMaterial }).material
      mat.color.copy(c.tmp.lerpColors(c.lf2Light, c.lf2Dark, t))
      const intensity = 2.0 + (0.8 - 2.0) * t     // 2.0 → 0.8
      mat.color.multiplyScalar(intensity / 2.0)
    }
    if (lf3Ref.current) {
      const mat = (lf3Ref.current as unknown as { material: THREE.MeshBasicMaterial }).material
      mat.color.copy(c.tmp.lerpColors(c.lf3Light, c.lf3Dark, t))
      const intensity = 1.0 + (2.0 - 1.0) * t     // 1.0 → 2.0 (INCREASES — warm accent)
      mat.color.multiplyScalar(intensity / 1.0)
    }
  })

  return (
    <group rotation={[-Math.PI / 3, 0, 0]}>
      <Lightformer
        ref={lf1Ref}
        form="circle"
        intensity={isDarkTheme ? 2.5 : 4}
        color={isDarkTheme ? '#99aacc' : '#ffffff'}
        rotation-x={Math.PI / 2}
        position={[0, 5, -9]}
        scale={2}
      />
      <Lightformer
        ref={lf2Ref}
        form="circle"
        intensity={isDarkTheme ? 1.2 : 2}
        color={isDarkTheme ? '#7788bb' : '#ffffff'}
        rotation-y={Math.PI / 2}
        position={[-5, 1, -1]}
        scale={2}
      />
      <Lightformer
        ref={lf3Ref}
        form="ring"
        color={isDarkTheme ? '#5577aa' : '#ffd700'}
        intensity={isDarkTheme ? 0.6 : 1}
        rotation-y={Math.PI / 2}
        position={[5, 2, 0]}
        scale={3}
      />
    </group>
  )
}

export function Scene({ settings, shadowSettings, themeMode = 'light', gloveScaleRef, gloveRotationRef, gloveDuskRef, gloveHorizontalRef, gloveLeftRotRef, gloveRightRotRef }: { settings: Settings; shadowSettings?: ShadowSettings; themeMode?: ThemeMode; gloveScaleRef?: React.RefObject<number>; gloveRotationRef?: React.RefObject<number>; gloveDuskRef?: React.RefObject<number>; gloveHorizontalRef?: React.RefObject<number>; gloveLeftRotRef?: React.RefObject<number>; gloveRightRotRef?: React.RefObject<number> }) {
  const isDarkTheme = themeMode === 'dark' || themeMode === 'darkInverted'
  // Use shadow settings if provided, otherwise use defaults
  const lightPos: [number, number, number] = shadowSettings
    ? [shadowSettings.lightX, shadowSettings.lightY, shadowSettings.lightZ]
    : [0, 2.5, 10]
  const shadowMapSize: [number, number] = shadowSettings
    ? [shadowSettings.shadowMapSize, shadowSettings.shadowMapSize]
    : [1024, 1024]
  const cameraBounds = shadowSettings?.shadowCameraBounds ?? 10
  const cameraFar = shadowSettings?.shadowCameraFar ?? 30
  const shadowRadius = shadowSettings?.shadowRadius ?? 40 // Increased for more diffuse shadow
  const shadowBias = shadowSettings?.shadowBias ?? -0.00005
  const shadowOpacity = shadowSettings?.shadowOpacity ?? 0.12

  return (
    <div className="w-full h-full" style={{ pointerEvents: 'auto' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        shadows
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          gl.shadowMap.autoUpdate = true
          gl.shadowMap.needsUpdate = true
        }}
        style={{ background: 'transparent', pointerEvents: 'auto' }}
      >
        <Suspense fallback={null}>
          <ShadowMapUpdater />

          <ScaleGroup gloveScaleRef={gloveScaleRef}>
            <HorizontalTranslateGroup gloveHorizontalRef={gloveHorizontalRef}>
              <ScrollRotationGroup gloveRotationRef={gloveRotationRef}>
                <MouseFollowGroup>
                  <PhysicsWithPauseDetection>
                    <HangingSpheres settings={settings} shadowOpacity={shadowOpacity} themeMode={themeMode} gloveScaleRef={gloveScaleRef} gloveLeftRotRef={gloveLeftRotRef} gloveRightRotRef={gloveRightRotRef} />
                  </PhysicsWithPauseDetection>
                </MouseFollowGroup>
              </ScrollRotationGroup>
            </HorizontalTranslateGroup>
          </ScaleGroup>

          <Lighting
            lightPos={lightPos}
            shadowMapSize={shadowMapSize}
            cameraBounds={cameraBounds}
            cameraFar={cameraFar}
            shadowRadius={shadowRadius}
            shadowBias={shadowBias}
            isDarkTheme={isDarkTheme}
            themeMode={themeMode}
            gloveDuskRef={gloveDuskRef}
          />

          {/* Environment with custom lightformers for better reflections */}
          <Environment resolution={256}>
            <DuskLightformers isDarkTheme={isDarkTheme} gloveDuskRef={gloveDuskRef} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  )
}
