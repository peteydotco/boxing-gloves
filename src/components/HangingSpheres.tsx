import { useRef, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Settings } from './Scene'

// Fixed configuration
const ANCHOR_POSITION: [number, number, number] = [0, 2.8, 0] // Single shared origin

// Draggable glove with soft string constraint
function DraggableGloveWithRope({
  anchorOffset,
  settings,
}: {
  anchorOffset: [number, number, number]
  settings: Settings
}) {
  const gloveRef = useRef<RapierRigidBody>(null)
  const ropeGeomRef = useRef<THREE.BufferGeometry>(null)
  const { camera, gl } = useThree()
  const isDragging = useRef(false)
  const dragPlane = useRef(new THREE.Plane())
  const intersection = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())
  const velocityHistory = useRef<THREE.Vector3[]>([])
  const lastPosition = useRef(new THREE.Vector3())
  const ropePositions = useMemo(() => new Float32Array(5 * 3), [])
  const ropePoints = useMemo(() => {
    const pts = Array.from({ length: 5 }, () => new THREE.Vector3())
    return pts as [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]
  }, [])

  // This glove's anchor point
  const anchorPos = new THREE.Vector3(
    ANCHOR_POSITION[0] + anchorOffset[0],
    ANCHOR_POSITION[1] + anchorOffset[1],
    ANCHOR_POSITION[2] + anchorOffset[2]
  )

  // Start gloves above the anchor so they "drop in" and get caught by the rope
  const gloveStartPosition: [number, number, number] = [
    anchorPos.x,
    anchorPos.y + settings.stringLength * 0.75,
    anchorPos.z,
  ]

  // Soft string constraint + rope visual update
  useFrame((_, delta) => {
    if (!gloveRef.current) return

    const glove = gloveRef.current.translation()
    const gloveCenter = new THREE.Vector3(glove.x, glove.y, glove.z)
    const toGlove = gloveCenter.clone().sub(anchorPos)
    const distance = toGlove.length()

    // Springy rope constraint when beyond string length (no teleporting)
    if (!isDragging.current && distance > settings.stringLength) {
      const direction = toGlove.clone().normalize()
      const stretch = distance - settings.stringLength

      const vel = gloveRef.current.linvel()
      const radialSpeed = vel.x * direction.x + vel.y * direction.y + vel.z * direction.z

      // Critically-damped-ish spring along the rope axis
      const k = settings.springStrength
      const c = k * (1.2 * settings.ropeDamping) // simple tuned damping coefficient
      const accel = -k * stretch - c * radialSpeed

      // Convert to impulse: J = m * a * dt
      const m = Math.max(0.0001, gloveRef.current.mass())
      const j = accel * m * Math.min(0.033, Math.max(0.001, delta))
      gloveRef.current.applyImpulse(
        { x: direction.x * j, y: direction.y * j, z: direction.z * j },
        true
      )
    }

    // Update rope visual (cheap line with 5 control points)
    if (!ropeGeomRef.current) return

    // Calculate attachment point on glove surface (top of glove where string attaches)
    const toAnchor = anchorPos.clone().sub(gloveCenter).normalize()
    const gloveAttach = gloveCenter.clone().add(toAnchor.multiplyScalar(settings.radius * 1.5))

    // Create a slight sag in the middle for natural rope look
    const mid = anchorPos.clone().lerp(gloveAttach, 0.5)
    const ropeDistance = anchorPos.distanceTo(gloveAttach)
    const sag = Math.max(0, (settings.stringLength - ropeDistance) * 0.15)
    mid.y -= sag

    const quarter = anchorPos.clone().lerp(gloveAttach, 0.25)
    quarter.y -= sag * 0.5
    const threeQuarter = anchorPos.clone().lerp(gloveAttach, 0.75)
    threeQuarter.y -= sag * 0.5

    ropePoints[0].copy(anchorPos)
    ropePoints[1].copy(quarter)
    ropePoints[2].copy(mid)
    ropePoints[3].copy(threeQuarter)
    ropePoints[4].copy(gloveAttach)

    for (let i = 0; i < 5; i++) {
      ropePositions[i * 3 + 0] = ropePoints[i].x
      ropePositions[i * 3 + 1] = ropePoints[i].y
      ropePositions[i * 3 + 2] = ropePoints[i].z
    }
    const attr = ropeGeomRef.current.getAttribute('position') as THREE.BufferAttribute
    attr.needsUpdate = true
  })

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    if (!gloveRef.current) return

    isDragging.current = true
    velocityHistory.current = []

    const pos = gloveRef.current.translation()
    const glovePos = new THREE.Vector3(pos.x, pos.y, pos.z)
    lastPosition.current.copy(glovePos)

    const cameraDir = new THREE.Vector3()
    camera.getWorldDirection(cameraDir)
    dragPlane.current.setFromNormalAndCoplanarPoint(cameraDir.negate(), glovePos)

    const ray = e.ray as THREE.Ray
    ray.intersectPlane(dragPlane.current, intersection.current)
    offset.current.subVectors(glovePos, intersection.current)

    gloveRef.current.setBodyType(2, true)
    ;(gl.domElement as HTMLElement).style.cursor = 'grabbing'
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [camera, gl])

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging.current || !gloveRef.current) return

    const ray = e.ray as THREE.Ray
    if (!ray.intersectPlane(dragPlane.current, intersection.current)) return

    let newPos = intersection.current.clone().add(offset.current)

    // Constrain to string length from anchor
    const toGlove = newPos.clone().sub(anchorPos)
    const distance = toGlove.length()

    if (distance > settings.stringLength) {
      toGlove.normalize().multiplyScalar(settings.stringLength)
      newPos = anchorPos.clone().add(toGlove)
    }

    const velocity = newPos.clone().sub(lastPosition.current).multiplyScalar(60)
    velocityHistory.current.push(velocity.clone())
    if (velocityHistory.current.length > 5) velocityHistory.current.shift()
    lastPosition.current.copy(newPos)

    gloveRef.current.setNextKinematicTranslation({
      x: newPos.x,
      y: newPos.y,
      z: newPos.z,
    })
  }, [anchorPos, settings.stringLength])

  const handlePointerUp = useCallback((e: any) => {
    if (!isDragging.current || !gloveRef.current) return

    isDragging.current = false
    ;(gl.domElement as HTMLElement).style.cursor = 'grab'
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    const avgVelocity = new THREE.Vector3()
    if (velocityHistory.current.length > 0) {
      velocityHistory.current.forEach((v) => avgVelocity.add(v))
      avgVelocity.divideScalar(velocityHistory.current.length)
    }

    gloveRef.current.setBodyType(0, true)
    // Flick tuning: threshold + clamp to keep it playful and controllable
    const flickThreshold = 0.75
    const maxFlickSpeed = 12
    const flickScale = 0.6
    const speed = avgVelocity.length()
    const v =
      speed < flickThreshold
        ? new THREE.Vector3(0, 0, 0)
        : avgVelocity.clone().multiplyScalar(flickScale).clampLength(0, maxFlickSpeed)

    gloveRef.current.setLinvel({ x: v.x, y: v.y, z: v.z }, true)
  }, [gl])

  return (
    <group>
      {/* Dynamic glove */}
      <RigidBody
        ref={gloveRef}
        position={gloveStartPosition}
        colliders={false}
        mass={settings.mass}
        restitution={settings.restitution}
        friction={settings.friction}
        linearDamping={settings.linearDamping}
        angularDamping={0.3}
      >
        <BallCollider args={[settings.radius * 1.2]} />
        
        <group
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOver={() => {
            if (!isDragging.current) {
              ;(gl.domElement as HTMLElement).style.cursor = 'grab'
            }
          }}
          onPointerOut={() => {
            if (!isDragging.current) {
              ;(gl.domElement as HTMLElement).style.cursor = 'default'
            }
          }}
        >
          {/* Main glove body (rectangular) */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[settings.radius * 2, settings.radius * 3, settings.radius * 2]} />
            <meshStandardMaterial
              color={settings.color}
              metalness={settings.metalness}
              roughness={settings.roughness}
              envMapIntensity={settings.envMapIntensity}
            />
          </mesh>
          
          {/* Knuckle area (sphere on front) */}
          <mesh castShadow position={[0, -settings.radius * 0.5, settings.radius * 0.8]}>
            <sphereGeometry args={[settings.radius * 0.9, 32, 32]} />
            <meshStandardMaterial
              color={settings.color}
              metalness={settings.metalness}
              roughness={settings.roughness}
              envMapIntensity={settings.envMapIntensity}
            />
          </mesh>
          
          {/* Thumb */}
          <mesh castShadow position={[settings.radius * 1.2, -settings.radius * 0.3, settings.radius * 0.5]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[settings.radius * 0.8, settings.radius * 1.2, settings.radius * 0.8]} />
            <meshStandardMaterial
              color={settings.color}
              metalness={settings.metalness}
              roughness={settings.roughness}
              envMapIntensity={settings.envMapIntensity}
            />
          </mesh>
          
          {/* Cuff (white band at wrist) */}
          <mesh castShadow position={[0, settings.radius * 1.3, 0]}>
            <cylinderGeometry args={[settings.radius * 1.1, settings.radius * 1.2, settings.radius * 0.8, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.1}
              roughness={0.9}
              envMapIntensity={0.2}
            />
          </mesh>
        </group>
      </RigidBody>

      {/* Rope visual */}
      <line>
        <bufferGeometry ref={ropeGeomRef}>
          <bufferAttribute
            attach="attributes-position"
            array={ropePositions}
            itemSize={3}
            count={5}
          />
        </bufferGeometry>
        <lineBasicMaterial color={settings.stringColor} />
      </line>
    </group>
  )
}

export function HangingSpheres({ settings }: { settings: Settings }) {
  return (
    <group>
      {/* Anchor point visual */}
      <mesh position={ANCHOR_POSITION}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left glove - offset slightly left from anchor */}
      <DraggableGloveWithRope
        anchorOffset={[-0.1, 0, 0]}
        settings={settings}
      />

      {/* Right glove - offset slightly right from anchor */}
      <DraggableGloveWithRope
        anchorOffset={[0.1, 0, 0]}
        settings={settings}
      />
    </group>
  )
}
