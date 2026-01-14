import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, Lightformer } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { HangingSpheres } from './HangingSpheres'

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

function Lighting() {
  return (
    <>
      {/* Key light - bright from upper right front */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={3}
        castShadow
        shadow-mapSize={[2048, 2048]}
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

export function Scene({ settings }: { settings: Settings }) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        {/* White background */}
        <color attach="background" args={['#ffffff']} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <HangingSpheres settings={settings} />
          </Physics>

          {/* Removed OrbitControls - no camera movement */}

          <Lighting />

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

          <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.4}
            scale={8}
            blur={2.5}
            far={4}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
