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

function Lighting({ lightPos, shadowMapSize, cameraBounds, cameraFar, shadowRadius, shadowBias, isDarkTheme, themeMode }: {
  lightPos: [number, number, number]
  shadowMapSize: [number, number]
  cameraBounds: number
  cameraFar: number
  shadowRadius: number
  shadowBias: number
  isDarkTheme: boolean
  themeMode: ThemeMode
}) {
  const isDarkestTheme = themeMode === 'darkInverted' // Pure black bg needs brighter spotlight
  const { gl } = useThree()
  const mainLightRef = useRef<THREE.DirectionalLight>(null)
  const fillLightRef = useRef<THREE.DirectionalLight>(null)

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
        position={[0, 3, -5]}
        intensity={backIntensity}
        color={backColor}
      />

      {/* Top light */}
      <pointLight
        position={[0, 6, 0]}
        intensity={topIntensity}
        color={topColor}
      />

      {/* Ambient fill */}
      <ambientLight intensity={ambientIntensity} color={isDarkTheme ? '#778899' : '#ffffff'} />

      {/* Spotlight for dark theme - focused dramatic lighting on the gloves */}
      {isDarkTheme && (
        <spotLight
          position={[0, 4, 8]}
          angle={isDarkestTheme ? 0.7 : 0.6}
          penumbra={isDarkestTheme ? 0.6 : 0.8}
          intensity={isDarkestTheme ? 80 : 40}
          color={isDarkestTheme ? '#ffffff' : '#aabbcc'}
          target-position={[0, 0, 0]}
        />
      )}
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

export function Scene({ settings, shadowSettings, themeMode = 'light' }: { settings: Settings; shadowSettings?: ShadowSettings; themeMode?: ThemeMode }) {
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

          <MouseFollowGroup>
            <PhysicsWithPauseDetection>
              <HangingSpheres settings={settings} shadowOpacity={shadowOpacity} themeMode={themeMode} />
            </PhysicsWithPauseDetection>
          </MouseFollowGroup>

          <Lighting
            lightPos={lightPos}
            shadowMapSize={shadowMapSize}
            cameraBounds={cameraBounds}
            cameraFar={cameraFar}
            shadowRadius={shadowRadius}
            shadowBias={shadowBias}
            isDarkTheme={isDarkTheme}
            themeMode={themeMode}
          />

          {/* Environment with custom lightformers for better reflections */}
          <Environment resolution={256}>
            <group rotation={[-Math.PI / 3, 0, 0]}>
              <Lightformer
                form="circle"
                intensity={isDarkTheme ? 2.5 : 4}
                color={isDarkTheme ? '#99aacc' : '#ffffff'}
                rotation-x={Math.PI / 2}
                position={[0, 5, -9]}
                scale={2}
              />
              <Lightformer
                form="circle"
                intensity={isDarkTheme ? 1.2 : 2}
                color={isDarkTheme ? '#7788bb' : '#ffffff'}
                rotation-y={Math.PI / 2}
                position={[-5, 1, -1]}
                scale={2}
              />
              <Lightformer
                form="ring"
                color={isDarkTheme ? '#5577aa' : '#ffd700'}
                intensity={isDarkTheme ? 0.6 : 1}
                rotation-y={Math.PI / 2}
                position={[5, 2, 0]}
                scale={3}
              />
            </group>
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  )
}
