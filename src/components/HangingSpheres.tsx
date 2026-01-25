import { useRef, useCallback, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody, BallCollider, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Settings } from '../types'
import glovesModelUrl from '../assets/optimized-gloves.glb?url'

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
  const start = anchorPos || new THREE.Vector3(0, 3.2, 0)
  const end = glovePos || new THREE.Vector3(0, 0.7, 0)
  const mid = new THREE.Vector3().lerpVectors(start, end, 0.5)

  const curve = new THREE.CatmullRomCurve3([start, mid, end])
  return new THREE.TubeGeometry(curve, ROPE_SEGMENTS, thickness, ROPE_RADIAL_SEGMENTS, false)
}

// Update tube geometry vertices in place without creating new geometry
function updateRopeGeometry(
  geometry: THREE.TubeGeometry,
  points: THREE.Vector3[],
  thickness: number
): void {
  const curve = new THREE.CatmullRomCurve3(points)
  const tubularSegments = ROPE_SEGMENTS
  const radialSegments = ROPE_RADIAL_SEGMENTS

  const frames = curve.computeFrenetFrames(tubularSegments, false)
  const position = geometry.attributes.position

  const vertex = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const P = new THREE.Vector3()

  // Generate vertices
  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments
    curve.getPointAt(u, P)

    const N = frames.normals[i]
    const B = frames.binormals[i]

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2
      const sin = Math.sin(v)
      const cos = -Math.cos(v)

      normal.x = cos * N.x + sin * B.x
      normal.y = cos * N.y + sin * B.y
      normal.z = cos * N.z + sin * B.z
      normal.normalize()

      vertex.x = P.x + thickness * normal.x
      vertex.y = P.y + thickness * normal.y
      vertex.z = P.z + thickness * normal.z

      const index = i * (radialSegments + 1) + j
      position.setXYZ(index, vertex.x, vertex.y, vertex.z)
    }
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
}

// Fixed configuration
const ANCHOR_POSITION: [number, number, number] = [0, 3.2, 0] // Single shared origin - raised to extend ropes off viewport


// Draggable glove with soft string constraint
function DraggableGloveWithRope({
  anchorOffset,
  settings,
  dropDelay = 0,
  desaturate = false,
}: {
  anchorOffset: [number, number, number]
  settings: Settings
  dropDelay?: number // Delay in ms before enabling physics (for staggered drop)
  desaturate?: boolean // Apply grayscale/desaturated effect for dark themes
}) {
  const gloveRef = useRef<RapierRigidBody>(null)
  const tubeRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()

  // Load the GLB model
  const { scene: gloveModel } = useGLTF(glovesModelUrl)
  const isDragging = useRef(false)
  const dragPlane = useRef(new THREE.Plane())
  const intersection = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())
  const velocityHistory = useRef<THREE.Vector3[]>([])
  const lastPosition = useRef(new THREE.Vector3())
  const hasDropped = useRef(false)
  const dropDelayElapsed = useRef(dropDelay === 0)
  const dropStartTime = useRef<number | null>(null)

  // Handle drop delay - start timer on mount
  useEffect(() => {
    if (dropDelay > 0) {
      dropStartTime.current = performance.now()
    }
  }, [dropDelay])

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
  const ropePoints = useRef<THREE.Vector3[]>([
    new THREE.Vector3(),
    new THREE.Vector3(),
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
    visualRotation.current.setFromEuler(new THREE.Euler(0, isLeftGlove ? (Math.PI * 2) / 3 : Math.PI, 0))
  }

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

      t.toGlove.copy(t.gloveCenter).sub(anchorPos)
      const distance = t.toGlove.length()

      // Initial drop-in animation: apply initial velocity of -4 units/second
      // Only trigger after drop delay has elapsed
      if (dropDelayElapsed.current && !hasDropped.current && t.gloveCenter.y < anchorPos.y + 2.5) {
        hasDropped.current = true
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

          // Add a bit of angular velocity on bounce for that wobbly tilt
          const angVel = gloveRef.current.angvel()
          const tiltStrength = radialSpeed * 0.5
          gloveRef.current.setAngvel(
            {
              x: angVel.x + (Math.random() - 0.5) * tiltStrength,
              y: angVel.y + (Math.random() - 0.5) * tiltStrength * 0.3,
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
          const restoreStrength = 5.0 // Gentle force to restore natural position
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
        const currentRotation = gloveRef.current.rotation()
        tempQuat.current.set(currentRotation.x, currentRotation.y, currentRotation.z, currentRotation.w)

        // Calculate the glove's local "down" direction (where knuckles should point)
        t.gloveDown.set(0, -1, 0).applyQuaternion(tempQuat.current)

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

    // Create a slight sag in the middle for natural rope look
    const ropeDistance = anchorPos.distanceTo(t.gloveAttach)
    const sag = Math.max(0, (settings.stringLength - ropeDistance) * 0.15)

    t.mid.copy(anchorPos).lerp(t.gloveAttach, 0.5)
    t.mid.y -= sag

    t.quarter.copy(anchorPos).lerp(t.gloveAttach, 0.25)
    t.quarter.y -= sag * 0.5

    t.threeQuarter.copy(anchorPos).lerp(t.gloveAttach, 0.75)
    t.threeQuarter.y -= sag * 0.5

    // Update rope points in place (no allocation)
    const pts = ropePoints.current
    pts[0].copy(anchorPos)
    pts[1].copy(t.quarter)
    pts[2].copy(t.mid)
    pts[3].copy(t.threeQuarter)
    pts[4].copy(t.gloveAttach)

    // Update geometry vertices in place (no new geometry allocation)
    updateRopeGeometry(ropeGeometry, pts, settings.stringThickness)
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
      {/* Physics body - invisible, only colliders */}
      <RigidBody
        ref={gloveRef}
        position={gloveStartPosition}
        colliders={false}
        mass={settings.mass}
        restitution={settings.restitution}
        friction={settings.friction}
        linearDamping={settings.linearDamping}
        angularDamping={0.2}
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

        {/* Collider for thumb - mirrored for left glove */}
        <CuboidCollider
          args={[settings.radius * 0.4, settings.radius * 0.6, settings.radius * 0.4]}
          position={[
            isLeftGlove ? -settings.radius * 1.2 : settings.radius * 1.2,
            -settings.radius * 0.3,
            settings.radius * 0.5
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
              ;(gl.domElement as HTMLElement).style.cursor = 'grab'
            }
          }}
          onPointerOut={() => {
            if (!isDragging.current) {
              ;(gl.domElement as HTMLElement).style.cursor = 'default'
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
        rotation={[0, isLeftGlove ? (Math.PI * 2) / 3 : Math.PI, 0]}
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

                // Apply desaturation for dark themes
                if (desaturate && mesh.material) {
                  const mat = mesh.material as THREE.MeshStandardMaterial
                  // Clone the material to avoid affecting the original
                  const newMat = mat.clone()

                  // Desaturate the base color to full grayscale
                  if (newMat.color) {
                    const r = newMat.color.r
                    const g = newMat.color.g
                    const b = newMat.color.b
                    const gray = r * 0.299 + g * 0.587 + b * 0.114
                    // Full grayscale
                    newMat.color.setRGB(gray, gray, gray)
                  }

                  // If the model has a color/diffuse map, we need to desaturate it
                  // Since we can't easily modify textures, we use onBeforeCompile to inject grayscale shader
                  newMat.onBeforeCompile = (shader) => {
                    // Add grayscale conversion to the fragment shader
                    shader.fragmentShader = shader.fragmentShader.replace(
                      '#include <map_fragment>',
                      `
                      #include <map_fragment>
                      // Convert to grayscale using luminance formula
                      float gray = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
                      // High contrast B&W - push darks to black, lights to white
                      float contrast = 2.2;
                      float brightness = 0.1;
                      gray = (gray - 0.5) * contrast + 0.5 + brightness;
                      // Crush blacks and boost whites for dramatic look
                      gray = smoothstep(0.05, 0.95, gray);
                      gray = clamp(gray, 0.0, 1.0);
                      // Pure B&W output
                      diffuseColor.rgb = vec3(gray);
                      `
                    )
                  }
                  // Force shader recompilation
                  newMat.needsUpdate = true
                  mesh.material = newMat
                }
              }
            })
            return cloned
          }, [gloveModel, desaturate])}
          scale={[
            (isLeftGlove ? -settings.radius : settings.radius) * 0.75,
            settings.radius * 0.75,
            settings.radius * 0.75
          ]}
          position={[0, settings.radius * 1.5, 0]}
          rotation={[0, isLeftGlove ? (Math.PI * 2) / 3 : Math.PI, 0]}
        />
      </group>

      {/* Rope visual - uses memoized geometry that's updated in place */}
      <mesh ref={tubeRef} geometry={ropeGeometry} frustumCulled={false}>
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  )
}

// Preload the gloves model
useGLTF.preload(glovesModelUrl)

export function HangingSpheres({ settings, shadowOpacity = 0.08, isDarkTheme = false }: { settings: Settings; shadowOpacity?: number; isDarkTheme?: boolean }) {
  return (
    <group>
      {/* Shadow plane behind gloves */}
      <mesh position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={shadowOpacity} transparent />
      </mesh>

      {/* Anchor point visual - hidden since it should be off-screen */}
      <mesh position={ANCHOR_POSITION} visible={false}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left glove - offset left and slightly forward, drops slightly after right */}
      <DraggableGloveWithRope
        anchorOffset={[-0.25, 0, 0.15]}
        dropDelay={100}
        desaturate={isDarkTheme}
        settings={{
          ...settings,
          stringLength: settings.stringLength + 0.25,
        }}
      />

      {/* Right glove - offset right and slightly back, with extended cord */}
      <DraggableGloveWithRope
        anchorOffset={[0.25, 0, -0.15]}
        desaturate={isDarkTheme}
        settings={{
          ...settings,
          stringLength: settings.stringLength + 0.7,
        }}
      />
    </group>
  )
}
