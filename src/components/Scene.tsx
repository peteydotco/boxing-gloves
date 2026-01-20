import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect, useRef, useState } from 'react'
import { HangingSpheres } from './HangingSpheres'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

// Global ref for mouse position - updated by App.tsx, read by Scene internals
// This avoids React re-renders when mouse moves
export const mousePositionRef = { current: { x: 0.5, y: 0.5 } }

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

function Lighting({ lightPos, shadowMapSize, cameraBounds, cameraFar, shadowRadius, shadowBias }: {
  lightPos: [number, number, number]
  shadowMapSize: [number, number]
  cameraBounds: number
  cameraFar: number
  shadowRadius: number
  shadowBias: number
}) {
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

  return (
    <>
      {/* Main light from front - creates shadow behind gloves */}
      <directionalLight
        ref={mainLightRef}
        position={lightPos}
        intensity={3}
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
        intensity={1.5}
        color="#a0c4ff"
      />

      {/* Back light - creates rim lighting */}
      <directionalLight
        position={[0, 3, -5]}
        intensity={2}
        color="#ffe4b5"
      />

      {/* Top light */}
      <pointLight
        position={[0, 6, 0]}
        intensity={30}
        color="#ffffff"
      />

      {/* Ambient fill */}
      <ambientLight intensity={0.6} />
    </>
  )
}

interface ShadowSettings {
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
    const maxRotation = 0.052
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

export function Scene({ settings, shadowSettings }: { settings: Settings; shadowSettings?: ShadowSettings }) {
  // Use shadow settings if provided, otherwise use defaults
  const lightPos: [number, number, number] = shadowSettings
    ? [shadowSettings.lightX, shadowSettings.lightY, shadowSettings.lightZ]
    : [0, 2.5, 10]
  const shadowMapSize: [number, number] = shadowSettings
    ? [shadowSettings.shadowMapSize, shadowSettings.shadowMapSize]
    : [1024, 1024]
  const cameraBounds = shadowSettings?.shadowCameraBounds ?? 10
  const cameraFar = shadowSettings?.shadowCameraFar ?? 30
  const shadowRadius = shadowSettings?.shadowRadius ?? 20
  const shadowBias = shadowSettings?.shadowBias ?? -0.00005
  const shadowOpacity = shadowSettings?.shadowOpacity ?? 0.12

  return (
    <div className="w-full h-full" style={{ pointerEvents: 'auto' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        shadows
        dpr={[1, 2]}
        frameloop="always"
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
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
              <HangingSpheres settings={settings} shadowOpacity={shadowOpacity} />
            </PhysicsWithPauseDetection>
          </MouseFollowGroup>

          <Lighting
            lightPos={lightPos}
            shadowMapSize={shadowMapSize}
            cameraBounds={cameraBounds}
            cameraFar={cameraFar}
            shadowRadius={shadowRadius}
            shadowBias={shadowBias}
          />

          {/* Environment with custom lightformers for better reflections */}
          <Environment resolution={256}>
            <group rotation={[-Math.PI / 3, 0, 0]}>
              <Lightformer
                form="circle"
                intensity={4}
                rotation-x={Math.PI / 2}
                position={[0, 5, -9]}
                scale={2}
              />
              <Lightformer
                form="circle"
                intensity={2}
                rotation-y={Math.PI / 2}
                position={[-5, 1, -1]}
                scale={2}
              />
              <Lightformer
                form="ring"
                color="#ffd700"
                intensity={1}
                rotation-y={Math.PI / 2}
                position={[5, 2, 0]}
                scale={3}
              />
            </group>
          </Environment>

          {/* Post-processing effects - Very subtle bloom */}
          <EffectComposer>
            <Bloom
              intensity={0.1}
              luminanceThreshold={0.95}
              luminanceSmoothing={0.95}
              blendFunction={BlendFunction.ADD}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
