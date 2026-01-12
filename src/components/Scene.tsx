import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, Lightformer, OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { HangingSpheres } from './HangingSpheres'

// Rearview mirror frame - realistic rounded rectangle shape
function MirrorFrame() {
  return (
    <group position={[0, 0.3, 0.3]}>
      {/* Mirror bezel - rounded rectangle using RoundedBox-like shape */}
      {/* Top edge */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[5.5, 0.15, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Bottom edge */}
      <mesh position={[0, -1.4, 0]}>
        <boxGeometry args={[5.5, 0.15, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Left edge */}
      <mesh position={[-2.8, 0.2, 0]}>
        <boxGeometry args={[0.15, 3.05, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Right edge */}
      <mesh position={[2.8, 0.2, 0]}>
        <boxGeometry args={[0.15, 3.05, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Stem connecting to car ceiling */}
      <mesh position={[0, 2.5, -0.2]} rotation={[0.15, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.4, 16]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Ball joint at top */}
      <mesh position={[0, 3.2, -0.4]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

// Grass ground - what you'd see in a rearview mirror
function GrassGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -2]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#2d5a27" roughness={0.9} />
    </mesh>
  )
}

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
      <ambientLight intensity={0.4} />
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
        <color attach="background" args={['#050508']} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <HangingSpheres settings={settings} />
          </Physics>

          {/* 3D camera controls - right-click/two-finger to rotate, scroll to zoom */}
          <OrbitControls
            enablePan={false}
            minDistance={3}
            maxDistance={15}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.5}
            mouseButtons={{
              LEFT: undefined, // Left click reserved for dragging balls
              MIDDLE: 2, // Middle = dolly/zoom
              RIGHT: 0, // Right click = rotate
            }}
            touches={{
              ONE: undefined, // Single touch reserved for dragging balls
              TWO: 2, // Two-finger = rotate + zoom
            }}
          />

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

          {/* Subtle mirror frame for context */}
          <MirrorFrame />

          {/* Grass background - like looking in a rearview mirror */}
          <GrassGround />

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
