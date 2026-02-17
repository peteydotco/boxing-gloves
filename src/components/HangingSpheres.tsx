import { useRef, useCallback, useMemo, useEffect, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody, BallCollider, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Settings } from '../types'
import leftGloveModelUrl from '../assets/gloveLEFT.glb?url'
import rightGloveModelUrl from '../assets/gloveRIGHT.glb?url'

// Rope segments for smooth curve
const ROPE_SEGMENTS = 32
const ROPE_RADIAL_SEGMENTS = 8

// Helper to create a reusable tube geometry that can be updated in place
// Takes initial anchor and glove positions to create geometry at the right location from the start
function createRopeGeometry(
  thickness: number,
  anchorPos?: THREE.Vector3,
  glovePos?: THREE.Vector3
): THREE.TubeGeometry {
  // If positions provided, create geometry at correct initial location
  // Otherwise create a minimal geometry that will be updated on first frame
  const start = anchorPos ? new THREE.Vector3(0, anchorPos.y + 4, 0) : new THREE.Vector3(0, 7.2, 0)
  const end = glovePos || new THREE.Vector3(0, 0.7, 0)
  const mid = new THREE.Vector3().lerpVectors(start, end, 0.5)

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  return new THREE.TubeGeometry(curve, ROPE_SEGMENTS, thickness, ROPE_RADIAL_SEGMENTS, false)
}

// Reusable vectors for updateRopeGeometry (avoid per-frame allocation)
const _P = new THREE.Vector3()
const _T = new THREE.Vector3()
const _N = new THREE.Vector3()
const _B = new THREE.Vector3()
const _vertex = new THREE.Vector3()
const _normal = new THREE.Vector3()
const _refDir = new THREE.Vector3(0, 0, 1) // Fixed reference for stable normals

// Update tube geometry vertices in place without creating new geometry.
// Uses a fixed-reference-vector approach instead of Frenet frames to avoid
// normal flipping on near-straight or low-curvature curves.
function updateRopeGeometry(
  geometry: THREE.TubeGeometry,
  points: THREE.Vector3[],
  thickness: number
): void {
  const curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2])
  const tubularSegments = ROPE_SEGMENTS
  const radialSegments = ROPE_RADIAL_SEGMENTS
  const position = geometry.attributes.position

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments
    curve.getPointAt(u, _P)
    curve.getTangentAt(u, _T)

    // Build a stable frame from a fixed reference direction.
    // B = normalize(T × ref), N = normalize(B × T)
    // If T is nearly parallel to ref, fall back to X-axis.
    _B.crossVectors(_T, _refDir)
    if (_B.lengthSq() < 1e-6) {
      _B.crossVectors(_T, _N.set(1, 0, 0))
    }
    _B.normalize()
    _N.crossVectors(_B, _T).normalize()

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2
      const sin = Math.sin(v)
      const cos = -Math.cos(v)

      _normal.x = cos * _N.x + sin * _B.x
      _normal.y = cos * _N.y + sin * _B.y
      _normal.z = cos * _N.z + sin * _B.z
      _normal.normalize()

      _vertex.x = _P.x + thickness * _normal.x
      _vertex.y = _P.y + thickness * _normal.y
      _vertex.z = _P.z + thickness * _normal.z

      const index = i * (radialSegments + 1) + j
      position.setXYZ(index, _vertex.x, _vertex.y, _vertex.z)
    }
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
}

// Fixed configuration
const ANCHOR_POSITION: [number, number, number] = [0, 3.2, 0] // Single shared origin


// Draggable glove with soft string constraint
function DraggableGloveWithRope({
  anchorOffset,
  settings,
  dropDelay = 0,
  themeMode = 'light',
  modelUrl,
  yRotation = Math.PI,
  scrollRotRef,
}: {
  anchorOffset: [number, number, number]
  settings: Settings
  dropDelay?: number // Delay in ms before enabling physics (for staggered drop)
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted' // Theme mode for color adjustments
  modelUrl: string // URL to the glove GLB model
  yRotation?: number // Initial Y-axis rotation in radians
  scrollRotRef?: RefObject<number> // Per-glove scroll-driven Y rotation
}) {
  const gloveRef = useRef<RapierRigidBody>(null)
  const tubeRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()

  // Load the GLB model (with Draco decoder for compressed meshes)
  const { scene: gloveModel } = useGLTF(modelUrl, true)
  const isDragging = useRef(false)
  const dragPlane = useRef(new THREE.Plane())
  const intersection = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())
  const velocityHistory = useRef<THREE.Vector3[]>([])
  const lastPosition = useRef(new THREE.Vector3())
  const hasDropped = useRef(false)
  const dropDelayElapsed = useRef(dropDelay === 0)
  const dropStartTime = useRef<number | null>(null)
  const dragEndTime = useRef<number>(0) // Timestamp when drag ended, for post-drag settle
  const touchMoveBlocker = useRef<((e: TouchEvent) => void) | null>(null)

  // Reusable Vector3 objects to avoid garbage collection in useFrame
  const tempVec = useRef({
    gloveCenter: new THREE.Vector3(),
    toGlove: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    constrainedPos: new THREE.Vector3(),
    naturalPos: new THREE.Vector3(),
    toNatural: new THREE.Vector3(),
    restoreForce: new THREE.Vector3(),
    worldDown: new THREE.Vector3(0, -1, 0),
    gloveDown: new THREE.Vector3(),
    torqueAxis: new THREE.Vector3(),
    gloveAttach: new THREE.Vector3(),
    attachOffset: new THREE.Vector3(), // Local offset for rope attachment point
    mid: new THREE.Vector3(),
    quarter: new THREE.Vector3(),
    threeQuarter: new THREE.Vector3(),
  })
  const tempQuat = useRef(new THREE.Quaternion())
  const scrollQuat = useRef(new THREE.Quaternion()) // Reusable quat for scroll-driven rotation

  // This glove's anchor point - memoized to prevent recreation
  const anchorPos = useMemo(() => new THREE.Vector3(
    ANCHOR_POSITION[0] + anchorOffset[0],
    ANCHOR_POSITION[1] + anchorOffset[1],
    ANCHOR_POSITION[2] + anchorOffset[2]
  ), [anchorOffset])

  // Determine if this is the left glove (for rope attachment) - computed once
  const isLeftGlove = useMemo(() => anchorOffset[0] < 0, [anchorOffset])

  // Create rope geometry once and reuse it
  // Pass initial positions so the rope is visible immediately (not at origin)
  // Gloves start 3 units above anchor, so rope should start there too
  const initialGlovePos = useMemo(() => new THREE.Vector3(
    anchorPos.x,
    anchorPos.y + 3, // Match gloveStartPosition
    anchorPos.z
  ), [anchorPos])

  const ropeGeometry = useMemo(
    () => createRopeGeometry(settings.stringThickness, anchorPos, initialGlovePos),
    [settings.stringThickness, anchorPos, initialGlovePos]
  )

  // Reusable array for rope curve points (avoid allocation in useFrame)
  // 3 points: anchor + mid (with sag) + gloveAttach
  const ropePoints = useRef<THREE.Vector3[]>([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ])

  // Cleanup geometry on unmount
  useEffect(() => {
    return () => {
      ropeGeometry.dispose()
    }
  }, [ropeGeometry])

  // Cleanup touchmove blocker if component unmounts during drag
  useEffect(() => {
    const domElement = gl.domElement
    return () => {
      if (touchMoveBlocker.current) {
        domElement.removeEventListener('touchmove', touchMoveBlocker.current)
        touchMoveBlocker.current = null
      }
    }
  }, [gl])

  // Start gloves above the anchor point for drop-in animation
  const gloveStartPosition = useMemo((): [number, number, number] => [
    anchorPos.x,
    anchorPos.y + 3, // Start 3 units above anchor point
    anchorPos.z,
  ], [anchorPos])

  // Smooth visual position - interpolates towards physics position
  // Initialize at glove start position so rope is visible immediately
  // We need to compute these values fresh each render to ensure they're current
  const visualPosition = useRef<THREE.Vector3 | null>(null)
  const visualRotation = useRef<THREE.Quaternion | null>(null)
  const visualGroupRef = useRef<THREE.Group>(null)
  const frameCount = useRef(0)
  const isInitialized = useRef(false)
  const settledTime = useRef(0) // Track time since drop completed

  // Lazily initialize visual position/rotation on first access to ensure anchorPos is ready
  if (!visualPosition.current) {
    visualPosition.current = new THREE.Vector3(
      anchorPos.x,
      anchorPos.y + 3, // Match glove start position
      anchorPos.z
    )
  }
  if (!visualRotation.current) {
    // Initialize with the glove's starting rotation (facing user)
    visualRotation.current = new THREE.Quaternion()
    visualRotation.current.setFromEuler(new THREE.Euler(0, yRotation, 0))
  }

  // Handle drop delay - start timer on mount
  useEffect(() => {
    if (dropDelay > 0) {
      dropStartTime.current = performance.now()
    }
  }, [dropDelay])

  // Soft string constraint + rope visual update
  useFrame(() => {
    const t = tempVec.current
    frameCount.current++

    // Check if drop delay has elapsed
    if (!dropDelayElapsed.current && dropStartTime.current !== null) {
      if (performance.now() - dropStartTime.current >= dropDelay) {
        dropDelayElapsed.current = true
      }
    }

    // Update physics and visual position if physics body is ready
    if (gloveRef.current && visualGroupRef.current) {
      // Hold glove at start position until drop delay has elapsed
      if (!dropDelayElapsed.current) {
        gloveRef.current.setTranslation(
          { x: gloveStartPosition[0], y: gloveStartPosition[1], z: gloveStartPosition[2] },
          true
        )
        gloveRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      }

      const glove = gloveRef.current.translation()
      const gloveRot = gloveRef.current.rotation()

      t.gloveCenter.set(glove.x, glove.y, glove.z)
      tempQuat.current.set(gloveRot.x, gloveRot.y, gloveRot.z, gloveRot.w)

      // Initialize visual position on first frame
      if (!isInitialized.current) {
        visualPosition.current!.copy(t.gloveCenter)
        visualRotation.current!.copy(tempQuat.current)
        isInitialized.current = true
      }

      // Smoothly interpolate visual position towards physics position
      // This prevents sudden jumps from being visible
      // Lower values = smoother but more lag, higher = more responsive but shows jumps
      // Note: This only affects visuals, not the underlying physics simulation
      // Use responsive lerp during initial drop + settling, then switch to smoother
      if (hasDropped.current) {
        settledTime.current += 1/60 // Approximate frame time
      }
      // Stay responsive for 2 seconds after drop, then transition to smooth
      const isSettled = settledTime.current > 2.0
      const lerpFactor = isSettled ? 0.08 : 0.5
      visualPosition.current!.lerp(t.gloveCenter, lerpFactor)
      visualRotation.current!.slerp(tempQuat.current, lerpFactor)

      // Update the visual group position and rotation
      visualGroupRef.current.position.copy(visualPosition.current!)
      visualGroupRef.current.quaternion.copy(visualRotation.current!)

      // Compose scroll-driven per-glove rotation on top of physics rotation,
      // and push glove outward to prevent clipping during the turn.
      if (scrollRotRef?.current) {
        const rot = scrollRotRef.current
        scrollQuat.current.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rot)
        visualGroupRef.current.quaternion.multiply(scrollQuat.current)

        // Spread apart — push outward proportional to rotation magnitude
        const spread = Math.abs(rot) / (Math.PI * 0.75) * 0.35 // up to 0.35 units at full rotation
        const sign = isLeftGlove ? -1 : 1
        visualGroupRef.current.position.x += sign * spread
      }

      t.toGlove.copy(t.gloveCenter).sub(anchorPos)
      const distance = t.toGlove.length()

      // Initial drop-in animation: apply initial velocity of -4 units/second
      // Only trigger after drop delay has elapsed
      if (dropDelayElapsed.current && !hasDropped.current && t.gloveCenter.y < anchorPos.y + 2.5) {
        hasDropped.current = true
        dragEndTime.current = performance.now() // Trigger post-drop settle toward front-facing
        gloveRef.current.setLinvel({ x: 0, y: -4, z: 0 }, true)
      }

      // Apply string constraint when beyond string length
      if (!isDragging.current && distance > settings.stringLength) {
        t.direction.copy(t.toGlove).normalize()

        // Hard constraint - snap back immediately to string length
        t.constrainedPos.copy(t.direction).multiplyScalar(settings.stringLength).add(anchorPos)
        gloveRef.current.setTranslation(
          { x: t.constrainedPos.x, y: t.constrainedPos.y, z: t.constrainedPos.z },
          true
        )

        // Convert outward velocity to inward bounce (spring effect)
        const vel = gloveRef.current.linvel()
        const radialSpeed = vel.x * t.direction.x + vel.y * t.direction.y + vel.z * t.direction.z
        if (radialSpeed > 0) {
          // Bounce factor - how much of the outward velocity becomes inward
          const bounceFactor = 0.25
          gloveRef.current.setLinvel(
            {
              x: vel.x - t.direction.x * radialSpeed * (1 + bounceFactor),
              y: vel.y - t.direction.y * radialSpeed * (1 + bounceFactor),
              z: vel.z - t.direction.z * radialSpeed * (1 + bounceFactor),
            },
            true
          )

          // Add angular velocity on bounce — random wobble on X/Z, but bias Y toward front-facing
          const angVel = gloveRef.current.angvel()
          const tiltStrength = radialSpeed * 0.5

          // Compute yaw correction toward the target front-facing rotation
          const currentRot = gloveRef.current.rotation()
          const bounceEuler = new THREE.Euler().setFromQuaternion(
            new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w), 'YXZ'
          )
          const yawDiff = yRotation - bounceEuler.y
          // Normalize yawDiff to [-PI, PI]
          const normalizedYaw = ((yawDiff + Math.PI) % (2 * Math.PI)) - Math.PI

          gloveRef.current.setAngvel(
            {
              x: angVel.x + (Math.random() - 0.5) * tiltStrength,
              y: angVel.y + normalizedYaw * 0.3, // Bias toward front-facing instead of random
              z: angVel.z + (Math.random() - 0.5) * tiltStrength,
            },
            true
          )
        }
      }

      // Apply restoring force to pull gloves back to natural hanging position
      // This prevents gloves from unnaturally resting on top of each other
      if (!isDragging.current) {
        // Natural hanging position is directly below anchor at string length
        t.naturalPos.set(anchorPos.x, anchorPos.y - settings.stringLength, anchorPos.z)
        t.toNatural.copy(t.naturalPos).sub(t.gloveCenter)
        const distanceFromNatural = t.toNatural.length()

        // Apply a gentle restoring force when not at natural position
        if (distanceFromNatural > 0.01) {
          const restoreStrength = 5.0 // Balanced — snappy drop without distorting the fall path
          t.restoreForce.copy(t.toNatural).normalize().multiplyScalar(restoreStrength * distanceFromNatural)

          const vel = gloveRef.current.linvel()
          gloveRef.current.setLinvel(
            {
              x: vel.x + t.restoreForce.x * 0.016, // Apply force scaled by frame time (~16ms)
              y: vel.y + t.restoreForce.y * 0.016,
              z: vel.z + t.restoreForce.z * 0.016,
            },
            true
          )
        }

        // Apply torque to make bottom (knuckle/ball) hang lowest (heaviest part)
        // This simulates bottom-heavy center of mass - like a tree air freshener
        // Skip during initial drop so gloves fall straight, then kick in to orient front-facing
        if (settledTime.current > 0.4) {
          const currentRotation = gloveRef.current.rotation()
          tempQuat.current.set(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w)

          // Local "gravity target" — mostly down, slightly toward glove's front (local Z+)
          // This makes gravity pull the front face toward the camera as it settles
          // Subtle bias so the initial drop looks straight, but gloves still settle front-facing
          t.gloveDown.set(0, -1, 0.15).normalize().applyQuaternion(tempQuat.current)

          // Calculate torque needed to align glove's bottom with world down
          t.torqueAxis.crossVectors(t.gloveDown, t.worldDown)
          const torqueMagnitude = Math.asin(Math.min(1, t.torqueAxis.length())) * 4.0 // Gentler for more swing

          if (t.torqueAxis.length() > 0.01) {
            t.torqueAxis.normalize().multiplyScalar(torqueMagnitude)
            const angVel = gloveRef.current.angvel()
            gloveRef.current.setAngvel(
              {
                x: angVel.x + t.torqueAxis.x * 0.08,
                y: angVel.y + t.torqueAxis.y * 0.08,
                z: angVel.z + t.torqueAxis.z * 0.08,
              },
              true
            )
          }
        }
      }
    }

    // Update rope visual - runs even before physics is ready
    if (!tubeRef.current || !visualPosition.current || !visualRotation.current) return

    // Calculate attachment point at stitching area on upper front of glove
    // Use visualPosition and visualRotation (smoothed) to match the visual glove
    // The offset is in local space and needs to be rotated by the glove's orientation
    const ropeXOffset = isLeftGlove ? settings.radius * 0.15 : -settings.radius * 0.15
    const ropeYOffset = settings.radius * 1.7
    const ropeZOffset = settings.radius * 0.3 // Slightly toward front where stitching is
    t.attachOffset.set(ropeXOffset, ropeYOffset, ropeZOffset) // Local offset
    t.attachOffset.applyQuaternion(visualRotation.current) // Rotate by glove orientation
    t.gloveAttach.copy(visualPosition.current).add(t.attachOffset) // Add to position

    // Rope sag — only when there's slack (rope shorter than string length)
    const ropeDistance = anchorPos.distanceTo(t.gloveAttach)
    const sag = Math.max(0, (settings.stringLength - ropeDistance) * 0.15)

    t.mid.copy(anchorPos).lerp(t.gloveAttach, 0.5)
    t.mid.y -= sag

    // Build a smooth curve via quadratic Bezier (no CatmullRom inflection).
    // Sample 3 points along the Bezier: start, middle, end.
    // The control point is the sagged midpoint pushed further out so the
    // Bezier's actual midpoint lands on t.mid (Bezier mid = avg of endpoints
    // and control weighted, so control needs 2× the offset).
    const pts = ropePoints.current
    // Start the rope well above the anchor (off-screen) so the shadow is one
    // continuous curve with no seam. The old separate shadow-extension cylinder
    // created a visible kink where it met the curved rope.
    pts[0].set(0, anchorPos.y + 4, 0)
    // Push control point to 2× sag so the curve's geometric midpoint matches t.mid
    pts[1].copy(anchorPos).lerp(t.gloveAttach, 0.5)
    pts[1].y -= sag * 2
    pts[2].copy(t.gloveAttach)

    // Update geometry vertices in place (no new geometry allocation)
    updateRopeGeometry(ropeGeometry, pts, settings.stringThickness)
  })

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    if (!gloveRef.current) return

    isDragging.current = true
    velocityHistory.current = []

    // Suppress native scroll while dragging a glove (non-passive to allow preventDefault)
    touchMoveBlocker.current = (te: TouchEvent) => te.preventDefault()
    gl.domElement.addEventListener('touchmove', touchMoveBlocker.current, { passive: false })

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
    ;(gl.domElement as HTMLElement).style.cursor = 'none'
    gl.domElement.setAttribute('data-cursor', 'drag')
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

    // Restore native scroll
    if (touchMoveBlocker.current) {
      gl.domElement.removeEventListener('touchmove', touchMoveBlocker.current)
      touchMoveBlocker.current = null
    }

    ;(gl.domElement as HTMLElement).style.cursor = 'none'
    gl.domElement.setAttribute('data-cursor', 'grab')
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

    // On release, heavily dampen yaw spin so gravity torque can steer front-facing
    const angVel = gloveRef.current.angvel()
    gloveRef.current.setAngvel(
      {
        x: angVel.x,
        y: angVel.y * 0.2, // Kill most yaw spin from the fling
        z: angVel.z,
      },
      true
    )

    dragEndTime.current = performance.now()
  }, [gl])

  return (
    <group>
      {/* Physics body - invisible, only colliders */}
      <RigidBody
        ref={gloveRef}
        position={gloveStartPosition}
        rotation={[0, yRotation, 0]}
        colliders={false}
        mass={settings.mass}
        restitution={Math.max(settings.restitution, 0.6)}
        friction={Math.min(settings.friction, 0.1)}
        linearDamping={settings.linearDamping}
        angularDamping={1.5}
      >
        {/* Collider for main glove body (rectangular box) */}
        <CuboidCollider
          args={[settings.radius, settings.radius * 1.5, settings.radius]}
          position={[0, 0, 0]}
        />

        {/* Collider for knuckle area (sphere, centered Z to avoid back-facing bias) */}
        <BallCollider
          args={[settings.radius * 0.9]}
          position={[0, -settings.radius * 0.5, 0]}
        />

        {/* Collider for thumb - mirrored for left glove, centered Z */}
        <CuboidCollider
          args={[settings.radius * 0.4, settings.radius * 0.6, settings.radius * 0.4]}
          position={[
            isLeftGlove ? -settings.radius * 1.2 : settings.radius * 1.2,
            -settings.radius * 0.3,
            0
          ]}
          rotation={[0, 0, isLeftGlove ? -0.3 : 0.3]}
        />

        {/* Collider for cuff (white band at wrist) */}
        <CylinderCollider
          args={[settings.radius * 0.4, settings.radius * 1.15]}
          position={[0, settings.radius * 1.3, 0]}
        />

        {/* Invisible interaction mesh for pointer events */}
        <mesh
          visible={false}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOver={() => {
            if (!isDragging.current) {
              ;(gl.domElement as HTMLElement).style.cursor = 'none'
              gl.domElement.setAttribute('data-cursor', 'grab')
            }
          }}
          onPointerOut={() => {
            if (!isDragging.current) {
              ;(gl.domElement as HTMLElement).style.cursor = 'default'
              gl.domElement.removeAttribute('data-cursor')
            }
          }}
        >
          <boxGeometry args={[settings.radius * 3, settings.radius * 4, settings.radius * 3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Visual glove - smoothly interpolated, separate from physics */}
      <group
        ref={visualGroupRef}
        position={gloveStartPosition}
        rotation={[0, yRotation, 0]}
      >
        <primitive
          object={useMemo(() => {
            const cloned = gloveModel.clone()
            // Enable shadows on all meshes in the model and optionally desaturate
            cloned.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true

                // Apply color adjustments based on theme
                const isInvertedTheme = themeMode === 'inverted'
                const isDarkTheme = themeMode === 'dark'
                const isDarkestTheme = themeMode === 'darkInverted'

                if ((isInvertedTheme || isDarkTheme || isDarkestTheme) && mesh.material) {
                  const mat = mesh.material as THREE.MeshStandardMaterial
                  // Clone the material to avoid affecting the original
                  const newMat = mat.clone()

                  if (isDarkestTheme) {
                    // Full B&W desaturation for darkest theme
                    if (newMat.color) {
                      const r = newMat.color.r
                      const g = newMat.color.g
                      const b = newMat.color.b
                      const gray = r * 0.299 + g * 0.587 + b * 0.114
                      newMat.color.setRGB(gray, gray, gray)
                    }

                    // Inject grayscale shader for textures
                    newMat.onBeforeCompile = (shader) => {
                      shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <map_fragment>',
                        `
                        #include <map_fragment>
                        // Convert to grayscale using luminance formula
                        float gray = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
                        // Medium contrast B&W
                        float contrast = 1.8;
                        float brightness = 0.12;
                        gray = (gray - 0.5) * contrast + 0.5 + brightness;
                        // Moderate curve for balanced look
                        gray = smoothstep(0.1, 0.9, gray);
                        gray = clamp(gray, 0.0, 1.0);
                        // Pure B&W output
                        diffuseColor.rgb = vec3(gray);
                        `
                      )
                    }
                  } else if (isInvertedTheme) {
                    // Moderate darkening for inverted theme
                    if (newMat.color) {
                      const darkFactor = 0.90
                      newMat.color.setRGB(
                        newMat.color.r * darkFactor,
                        newMat.color.g * darkFactor,
                        newMat.color.b * darkFactor
                      )
                    }

                    // Inject shader to darken textures while keeping color
                    newMat.onBeforeCompile = (shader) => {
                      shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <map_fragment>',
                        `
                        #include <map_fragment>
                        // Darken while preserving color
                        diffuseColor.rgb *= 0.90;
                        `
                      )
                    }
                  } else if (isDarkTheme) {
                    // Slight darkening for dark theme
                    if (newMat.color) {
                      const darkFactor = 0.95
                      newMat.color.setRGB(
                        newMat.color.r * darkFactor,
                        newMat.color.g * darkFactor,
                        newMat.color.b * darkFactor
                      )
                    }

                    // Inject shader to darken textures while keeping color
                    newMat.onBeforeCompile = (shader) => {
                      shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <map_fragment>',
                        `
                        #include <map_fragment>
                        // Darken while preserving color
                        diffuseColor.rgb *= 0.95;
                        `
                      )
                    }
                  }

                  // Force shader recompilation
                  newMat.needsUpdate = true
                  mesh.material = newMat
                }
              }
            })
            return cloned
          }, [gloveModel, themeMode])}
          scale={[
            settings.radius * 0.75,
            settings.radius * 0.75,
            settings.radius * 0.75
          ]}
          position={[0, settings.radius * 1.5, 0]}
        />
      </group>

      {/* Rope visual - uses memoized geometry that's updated in place */}
      <mesh ref={tubeRef} geometry={ropeGeometry} frustumCulled={false} castShadow>
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.1} />
      </mesh>

    </group>
  )
}

// Preload the glove models (with Draco decoder for compressed meshes)
useGLTF.preload(leftGloveModelUrl, true)
useGLTF.preload(rightGloveModelUrl, true)

export function HangingSpheres({ settings, shadowOpacity = 0.08, themeMode = 'light', gloveScaleRef, gloveLeftRotRef, gloveRightRotRef }: { settings: Settings; shadowOpacity?: number; themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'; gloveScaleRef?: RefObject<number>; gloveLeftRotRef?: RefObject<number>; gloveRightRotRef?: RefObject<number> }) {
  const shadowMatRef = useRef<THREE.ShadowMaterial>(null)

  // Fade shadow shortly after leaving hero — full at scale 1.15, gone by scale 1.11
  // (~27% into scroll travel). Clamp so it stays at 0 for the rest.
  useFrame(() => {
    if (!shadowMatRef.current || !gloveScaleRef?.current) return
    const FADE_END = 1.11   // shadow fully gone at this scale value
    const t = Math.min(1, Math.max(0, (gloveScaleRef.current - FADE_END) / (1.15 - FADE_END)))
    shadowMatRef.current.opacity = shadowOpacity * t
  })

  return (
    <group>
      {/* Shadow plane behind gloves — centered on rope midpoint (anchor y=3.2, gloves ~y=0)
          Tall enough to catch rope shadows that extend above the viewport */}
      <mesh position={[0, 2, -2]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial ref={shadowMatRef} opacity={shadowOpacity} transparent />
      </mesh>

      {/* Anchor point visual - hidden since it should be off-screen */}
      <mesh position={ANCHOR_POSITION} visible={false}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left glove - offset left and slightly forward, drops after right */}
      <DraggableGloveWithRope
        anchorOffset={[-0.4, 0, 0.15]}
        dropDelay={700}
        themeMode={themeMode}
        modelUrl={leftGloveModelUrl}
        yRotation={Math.PI + Math.PI / 6 - Math.PI / 4}
        scrollRotRef={gloveLeftRotRef}
        settings={{
          ...settings,
          stringLength: settings.stringLength + 0.25,
        }}
      />

      {/* Right glove - offset right and slightly back, with extended cord */}
      <DraggableGloveWithRope
        anchorOffset={[0.4, 0, -0.15]}
        dropDelay={600}
        themeMode={themeMode}
        modelUrl={rightGloveModelUrl}
        yRotation={Math.PI + (45 * Math.PI / 180)}
        scrollRotRef={gloveRightRotRef}
        settings={{
          ...settings,
          stringLength: settings.stringLength + 0.7,
        }}
      />
    </group>
  )
}
