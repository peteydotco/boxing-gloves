import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect } from 'react'
import { HangingSpheres } from './HangingSpheres'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

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

function Lighting({ lightPos, shadowMapSize, cameraBounds, cameraFar, shadowRadius, shadowBias }: {
  lightPos: [number, number, number]
  shadowMapSize: [number, number]
  cameraBounds: number
  cameraFar: number
  shadowRadius: number
  shadowBias: number
}) {
  const { gl } = useThree()

  // Force shadow map update when parameters change
  useEffect(() => {
    if (gl.shadowMap.enabled) {
      gl.shadowMap.needsUpdate = true
    }
  }, [lightPos, shadowMapSize, cameraBounds, cameraFar, shadowRadius, shadowBias, gl])

  return (
    <>
      {/* Main light from front - creates shadow behind gloves */}
      <directionalLight
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

export function Scene({ settings, shadowSettings }: { settings: Settings; shadowSettings?: ShadowSettings }) {
  // Use shadow settings if provided, otherwise use defaults
  const lightPos: [number, number, number] = shadowSettings
    ? [shadowSettings.lightX, shadowSettings.lightY, shadowSettings.lightZ]
    : [0, 2.5, 10]
  const shadowMapSize: [number, number] = shadowSettings
    ? [shadowSettings.shadowMapSize, shadowSettings.shadowMapSize]
    : [2048, 2048]
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
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.VSMShadowMap
          gl.shadowMap.autoUpdate = true
          gl.shadowMap.needsUpdate = true
        }}
        style={{ background: 'transparent', pointerEvents: 'auto' }}
      >
        <Suspense fallback={null}>
          <ShadowMapUpdater />

          <Physics gravity={[0, -9.81, 0]}>
            <HangingSpheres settings={settings} shadowOpacity={shadowOpacity} />
          </Physics>

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
