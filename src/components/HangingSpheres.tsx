import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider, CuboidCollider, CylinderCollider } from '@react-three/rapier'
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
  const tubeRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()
  const isDragging = useRef(false)
  const dragPlane = useRef(new THREE.Plane())
  const intersection = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())
  const velocityHistory = useRef<THREE.Vector3[]>([])
  const lastPosition = useRef(new THREE.Vector3())
  const hasDropped = useRef(false)

  // This glove's anchor point
  const anchorPos = new THREE.Vector3(
    ANCHOR_POSITION[0] + anchorOffset[0],
    ANCHOR_POSITION[1] + anchorOffset[1],
    ANCHOR_POSITION[2] + anchorOffset[2]
  )

  // Start gloves above the anchor point for drop-in animation
  const gloveStartPosition: [number, number, number] = [
    anchorPos.x,
    anchorPos.y + 3, // Start 3 units above anchor point
    anchorPos.z,
  ]

  // Soft string constraint + rope visual update
  useFrame(() => {
    if (!gloveRef.current) return

    const glove = gloveRef.current.translation()
    const gloveCenter = new THREE.Vector3(glove.x, glove.y, glove.z)
    const toGlove = gloveCenter.clone().sub(anchorPos)
    const distance = toGlove.length()

    // Initial drop-in animation: apply initial velocity of -4 units/second
    if (!hasDropped.current && gloveCenter.y < anchorPos.y + 2.5) {
      hasDropped.current = true
      gloveRef.current.setLinvel({ x: 0, y: -4, z: 0 }, true)
    }

    // Apply string constraint when beyond string length
    if (!isDragging.current && distance > settings.stringLength) {
      const direction = toGlove.clone().normalize()

      // Hard constraint - snap back immediately to string length
      toGlove.normalize().multiplyScalar(settings.stringLength)
      const constrainedPos = anchorPos.clone().add(toGlove)
      gloveRef.current.setTranslation(
        { x: constrainedPos.x, y: constrainedPos.y, z: constrainedPos.z },
        true
      )

      // Remove outward velocity component
      const vel = gloveRef.current.linvel()
      const radialSpeed = vel.x * direction.x + vel.y * direction.y + vel.z * direction.z
      if (radialSpeed > 0) {
        gloveRef.current.setLinvel(
          {
            x: vel.x - direction.x * radialSpeed,
            y: vel.y - direction.y * radialSpeed,
            z: vel.z - direction.z * radialSpeed,
          },
          true
        )
      }
    }

    // Apply restoring force to pull gloves back to natural hanging position
    // This prevents gloves from unnaturally resting on top of each other
    if (!isDragging.current) {
      // Natural hanging position is directly below anchor at string length
      const naturalPos = new THREE.Vector3(anchorPos.x, anchorPos.y - settings.stringLength, anchorPos.z)
      const toNatural = naturalPos.clone().sub(gloveCenter)
      const distanceFromNatural = toNatural.length()

      // Apply a gentle restoring force when not at natural position
      if (distanceFromNatural > 0.01) {
        const restoreStrength = 5.0 // Gentle force to restore natural position
        const restoreForce = toNatural.normalize().multiplyScalar(restoreStrength * distanceFromNatural)

        const vel = gloveRef.current.linvel()
        gloveRef.current.setLinvel(
          {
            x: vel.x + restoreForce.x * 0.016, // Apply force scaled by frame time (~16ms)
            y: vel.y + restoreForce.y * 0.016,
            z: vel.z + restoreForce.z * 0.016,
          },
          true
        )
      }

      // Apply torque to make bottom (knuckle) hang lowest (heaviest part)
      // Get current rotation and apply corrective torque to keep knuckles pointing down
      const currentRotation = gloveRef.current.rotation()
      const quat = new THREE.Quaternion(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w)

      // Calculate the "down" direction in world space
      const worldDown = new THREE.Vector3(0, -1, 0)

      // Calculate the glove's local "down" direction (where knuckles should point)
      // The knuckle is at negative Y in local space (at -radius * 0.5)
      const gloveDown = new THREE.Vector3(0, -1, 0).applyQuaternion(quat)

      // Calculate torque needed to align glove's bottom with world down
      const torqueAxis = new THREE.Vector3().crossVectors(gloveDown, worldDown)
      const torqueMagnitude = Math.asin(Math.min(1, torqueAxis.length())) * 3.0 // Strength factor

      if (torqueAxis.length() > 0.01) {
        torqueAxis.normalize().multiplyScalar(torqueMagnitude)
        const angVel = gloveRef.current.angvel()
        gloveRef.current.setAngvel(
          {
            x: angVel.x + torqueAxis.x * 0.1,
            y: angVel.y + torqueAxis.y * 0.1,
            z: angVel.z + torqueAxis.z * 0.1,
          },
          true
        )
      }
    }

    // Update rope visual
    if (!tubeRef.current) return

    // Calculate attachment point at top-inner corner of white cuff
    // White cuff is positioned at gloveCenter.y + radius * 1.3
    // Cuff height is radius * 0.8, so top of cuff is at: (radius * 1.3) + (radius * 0.4)
    // For inner corner: left glove uses +x (right edge), right glove uses -x (left edge)
    // This creates the "inner" corner effect where cords angle toward each other
    const isLeftGlove = anchorOffset[0] < 0
    const gloveAttach = new THREE.Vector3(
      gloveCenter.x + (isLeftGlove ? settings.radius * 0.7 : -settings.radius * 0.7), // Inner corner at edge of cuff
      gloveCenter.y + settings.radius * 1.3 + settings.radius * 0.4, // Top of the white cuff
      gloveCenter.z
    )

    // Create a slight sag in the middle for natural rope look
    const mid = anchorPos.clone().lerp(gloveAttach, 0.5)
    const ropeDistance = anchorPos.distanceTo(gloveAttach)
    const sag = Math.max(0, (settings.stringLength - ropeDistance) * 0.15)
    mid.y -= sag

    const quarter = anchorPos.clone().lerp(gloveAttach, 0.25)
    quarter.y -= sag * 0.5
    const threeQuarter = anchorPos.clone().lerp(gloveAttach, 0.75)
    threeQuarter.y -= sag * 0.5

    const points = [anchorPos, quarter, mid, threeQuarter, gloveAttach]
    const curve = new THREE.CatmullRomCurve3(points)
    const newGeometry = new THREE.TubeGeometry(curve, 32, settings.stringThickness, 8, false)
    tubeRef.current.geometry.dispose()
    tubeRef.current.geometry = newGeometry
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
    gloveRef.current.setLinvel(
      { x: avgVelocity.x * 0.5, y: avgVelocity.y * 0.5, z: avgVelocity.z * 0.5 },
      true
    )
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
        {/* Collider for main glove body (rectangular box) */}
        <CuboidCollider
          args={[settings.radius, settings.radius * 1.5, settings.radius]}
          position={[0, 0, 0]}
        />

        {/* Collider for knuckle area (sphere on front) */}
        <BallCollider
          args={[settings.radius * 0.9]}
          position={[0, -settings.radius * 0.5, settings.radius * 0.8]}
        />

        {/* Collider for thumb */}
        <CuboidCollider
          args={[settings.radius * 0.4, settings.radius * 0.6, settings.radius * 0.4]}
          position={[settings.radius * 1.2, -settings.radius * 0.3, settings.radius * 0.5]}
          rotation={[0, 0, 0.3]}
        />

        {/* Collider for cuff (white band at wrist) */}
        <CylinderCollider
          args={[settings.radius * 0.4, settings.radius * 1.15]}
          position={[0, settings.radius * 1.3, 0]}
        />

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
      <mesh ref={tubeRef}>
        <tubeGeometry args={[new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -1, 0),
        ]), 32, settings.stringThickness, 8, false]} />
        <meshStandardMaterial color="#000000" roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  )
}

export function HangingSpheres({ settings, shadowOpacity = 0.08 }: { settings: Settings; shadowOpacity?: number }) {
  return (
    <group>
      {/* Shadow plane behind gloves */}
      <mesh position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={shadowOpacity} transparent />
      </mesh>

      {/* Anchor point visual */}
      <mesh position={ANCHOR_POSITION}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left glove - lowered by 20px */}
      <DraggableGloveWithRope
        anchorOffset={[-0.1, 0, 0]}
        settings={{
          ...settings,
          stringLength: settings.stringLength + 0.25,
        }}
      />

      {/* Right glove - lowered by ~60px with extended cord */}
      <DraggableGloveWithRope
        anchorOffset={[0.1, 0, 0]}
        settings={{
          ...settings,
          stringLength: settings.stringLength + 0.7, // Extended cord length to reach lowered anchor (additional 10px)
        }}
      />
    </group>
  )
}
