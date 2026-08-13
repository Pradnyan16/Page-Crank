'use client';

/**
 * Globe.tsx — 3D Globe with retro wireframe aesthetic
 *
 * WHY: A subtle 3D globe reinforces the global/newsroom metaphor.
 * We use a wireframe sphere with points to represent a network rather
 * than a photorealistic earth. Lazy-loaded to avoid blocking the main thread.
 * Suspense fallback is an empty div so we don't flash a generic spinner.
 */

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const prefersReduced = useReducedMotion();

  useFrame((state, delta) => {
    if (prefersReduced || !meshRef.current) return;
    // Slow, deliberate rotation
    meshRef.current.rotation.y += delta * 0.1;
    meshRef.current.rotation.x += delta * 0.05;
  });

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]} scale={2}>
      <meshBasicMaterial
        color="#B08A3E" /* brass token */
        wireframe
        transparent
        opacity={0.3}
      />
    </Sphere>
  );
}

export default function Globe() {
  return (
    <div className="w-full max-w-sm mx-auto aspect-square opacity-60 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1} />
        <GlobeMesh />
      </Canvas>
    </div>
  );
}
