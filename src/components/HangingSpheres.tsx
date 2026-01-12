import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Settings } from './Scene'

// Fixed configuration
const ANCHOR_POSITION: [number, number, number] = [0, 2.8, 0] // Single shared origin

// Draggable sphere with soft string constraint (not rigid joint)
function DraggableSphereWithRope({
  anchorOffset,
  settings,
}: {
  anchorOffset: [number, number, number]
  settings: Settings
}) {
  const sphereRef = useRef<RapierRigidBody>(null)
  const tubeRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()
  const isDragging = useRef(false)
  const dragPlane = useRef(new THREE.Plane())
  const intersection = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())
  const velocityHistory = useRef<THREE.Vector3[]>([])
  const lastPosition = useRef(new THREE.Vector3())

  // This sphere's anchor point
  const anchorPos = new THREE.Vector3(
    ANCHOR_POSITION[0] + anchorOffset[0],
    ANCHOR_POSITION[1] + anchorOffset[1],
    ANCHOR_POSITION[2] + anchorOffset[2]
  )

  // Start spheres hanging at string length below their anchor
  const sphereStartPosition: [number, number, number] = [
    anchorPos.x,
    anchorPos.y - settings.stringLength,
    anchorPos.z,
  ]

  // Soft string constraint + rope visual update
  useFrame(() => {
    if (!sphereRef.current) return

    const sphere = sphereRef.current.translation()
    const sphereCenter = new THREE.Vector3(sphere.x, sphere.y, sphere.z)
    const toSphere = sphereCenter.clone().sub(anchorPos)
    const distance = toSphere.length()

    // Apply string constraint when beyond string length (only when not dragging)
    if (!isDragging.current && distance > settings.stringLength) {
      const direction = toSphere.clone().normalize()

      // Hard constraint - snap back immediately to string length
      // This prevents any stretching/bouncing oscillation
      toSphere.normalize().multiplyScalar(settings.stringLength)
      const constrainedPos = anchorPos.clone().add(toSphere)
      sphereRef.current.setTranslation(
        { x: constrainedPos.x, y: constrainedPos.y, z: constrainedPos.z },
        true
      )

      // Remove outward velocity component (keep tangent velocity for swinging)
      const vel = sphereRef.current.linvel()
      const radialSpeed = vel.x * direction.x + vel.y * direction.y + vel.z * direction.z
      if (radialSpeed > 0) {
        sphereRef.current.setLinvel(
          {
            x: vel.x - direction.x * radialSpeed,
            y: vel.y - direction.y * radialSpeed,
            z: vel.z - direction.z * radialSpeed,
          },
          true
        )
      }
    }

    // Update rope visual
    if (!tubeRef.current) return

    // Calculate attachment point on sphere surface (where line from anchor hits sphere)
    const toAnchor = anchorPos.clone().sub(sphereCenter).normalize()
    const sphereAttach = sphereCenter.clone().add(toAnchor.multiplyScalar(settings.radius))

    // Create a slight sag in the middle for natural rope look
    const mid = anchorPos.clone().lerp(sphereAttach, 0.5)
    const ropeDistance = anchorPos.distanceTo(sphereAttach)
    const sag = Math.max(0, (settings.stringLength - ropeDistance) * 0.15)
    mid.y -= sag

    const quarter = anchorPos.clone().lerp(sphereAttach, 0.25)
    quarter.y -= sag * 0.5
    const threeQuarter = anchorPos.clone().lerp(sphereAttach, 0.75)
    threeQuarter.y -= sag * 0.5

    const points = [anchorPos, quarter, mid, threeQuarter, sphereAttach]
    const curve = new THREE.CatmullRomCurve3(points)
    const newGeometry = new THREE.TubeGeometry(curve, 32, settings.stringThickness, 8, false)
    tubeRef.current.geometry.dispose()
    tubeRef.current.geometry = newGeometry
  })

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    if (!sphereRef.current) return

    isDragging.current = true
    velocityHistory.current = []

    const pos = sphereRef.current.translation()
    const spherePos = new THREE.Vector3(pos.x, pos.y, pos.z)
    lastPosition.current.copy(spherePos)

    const cameraDir = new THREE.Vector3()
    camera.getWorldDirection(cameraDir)
    dragPlane.current.setFromNormalAndCoplanarPoint(cameraDir.negate(), spherePos)

    const ray = e.ray as THREE.Ray
    ray.intersectPlane(dragPlane.current, intersection.current)
    offset.current.subVectors(spherePos, intersection.current)

    sphereRef.current.setBodyType(2, true)
    ;(gl.domElement as HTMLElement).style.cursor = 'grabbing'
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [camera, gl])

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging.current || !sphereRef.current) return

    const ray = e.ray as THREE.Ray
    if (!ray.intersectPlane(dragPlane.current, intersection.current)) return

    let newPos = intersection.current.clone().add(offset.current)

    // Constrain to string length from anchor
    const toSphere = newPos.clone().sub(anchorPos)
    const distance = toSphere.length()

    if (distance > settings.stringLength) {
      toSphere.normalize().multiplyScalar(settings.stringLength)
      newPos = anchorPos.clone().add(toSphere)
    }

    const velocity = newPos.clone().sub(lastPosition.current).multiplyScalar(60)
    velocityHistory.current.push(velocity.clone())
    if (velocityHistory.current.length > 5) velocityHistory.current.shift()
    lastPosition.current.copy(newPos)

    sphereRef.current.setNextKinematicTranslation({
      x: newPos.x,
      y: newPos.y,
      z: newPos.z,
    })
  }, [anchorPos, settings.stringLength])

  const handlePointerUp = useCallback((e: any) => {
    if (!isDragging.current || !sphereRef.current) return

    isDragging.current = false
    ;(gl.domElement as HTMLElement).style.cursor = 'grab'
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    const avgVelocity = new THREE.Vector3()
    if (velocityHistory.current.length > 0) {
      velocityHistory.current.forEach((v) => avgVelocity.add(v))
      avgVelocity.divideScalar(velocityHistory.current.length)
    }

    sphereRef.current.setBodyType(0, true)
    sphereRef.current.setLinvel(
      { x: avgVelocity.x * 0.5, y: avgVelocity.y * 0.5, z: avgVelocity.z * 0.5 },
      true
    )
  }, [gl])

  return (
    <group>
      {/* Dynamic sphere */}
      <RigidBody
        ref={sphereRef}
        position={sphereStartPosition}
        colliders={false}
        mass={settings.mass}
        restitution={settings.restitution}
        friction={settings.friction}
        linearDamping={settings.linearDamping}
        angularDamping={0.3}
      >
        <BallCollider args={[settings.radius]} />
        <mesh
          castShadow
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
          <sphereGeometry args={[settings.radius, 64, 64]} />
          <meshStandardMaterial
            color={settings.color}
            metalness={settings.metalness}
            roughness={settings.roughness}
            envMapIntensity={settings.envMapIntensity}
          />
        </mesh>
      </RigidBody>

      {/* Verlet rope visual */}
      <mesh ref={tubeRef}>
        <tubeGeometry args={[new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -1, 0),
        ]), 32, settings.stringThickness, 8, false]} />
        <meshStandardMaterial color={settings.stringColor} roughness={0.95} />
      </mesh>
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

      {/* Left ball - offset slightly left from anchor */}
      <DraggableSphereWithRope
        anchorOffset={[-0.1, 0, 0]}
        settings={settings}
      />

      {/* Right ball - offset slightly right from anchor */}
      <DraggableSphereWithRope
        anchorOffset={[0.1, 0, 0]}
        settings={settings}
      />
    </group>
  )
}
