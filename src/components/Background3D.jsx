import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AthenaTypography() {
  const textGroupRef = useRef();
  
  useFrame((state, delta) => {
    if (textGroupRef.current) {
      // Subtle hovering effect
      textGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <group ref={textGroupRef}>
      <Text
        fontSize={3.0}
        letterSpacing={0.2}
        color="#00f0ff"
        fillOpacity={0.15}
        strokeWidth={0.03}
        strokeColor="#008cff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0.5, 0]}
      >
        ATHENA
      </Text>
      
      <Text
        fontSize={1}
        letterSpacing={0.3}
        color="#00f0ff"
        fillOpacity={0.6}
        anchorX="center"
        anchorY="middle"
        position={[0, -2.8, 0]}
      >
        M A I N F R A M E  //  O N L I N E
      </Text>

      {/* Decorative framing lines behind text */}
      <mesh position={[0, -4.5, 0]}>
        <planeGeometry args={[14, 0.05]} />
        <meshBasicMaterial color="#008cff" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <planeGeometry args={[14, 0.05]} />
        <meshBasicMaterial color="#008cff" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function ParticleField() {
  const ref = useRef();

  const [positions, sizes] = useMemo(() => {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 4 + Math.random() * 25; 

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      siz[i] = Math.random() * 1.5;
    }
    return [pos, siz];
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta * 0.03;
      ref.current.rotation.z += delta * 0.01;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial 
        transparent 
        color="#008cff" 
        size={0.12} 
        sizeAttenuation={true} 
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

function InteractiveScene() {
  const groupRef = useRef();
  const pointerRef = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  useEffect(() => {
    const handleMouseMove = (e) => {
      pointerRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        pointerRef.current = {
          x: (e.touches[0].clientX / window.innerWidth) * 2 - 1,
          y: -(e.touches[0].clientY / window.innerHeight) * 2 + 1
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const handleOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        pointerRef.current = {
          x: Math.max(-1, Math.min(1, e.gamma / 45)),
          y: Math.max(-1, Math.min(1, (e.beta - 45) / 45))
        };
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const lerpSpeed = 5.0 * delta; 
      
      const targetX = pointerRef.current.x * 2.0; 
      const targetY = pointerRef.current.y * 2.0;

      groupRef.current.position.x += (targetX - groupRef.current.position.x) * lerpSpeed;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * lerpSpeed;

      const rotTargetX = -pointerRef.current.y * 0.15;
      const rotTargetY = pointerRef.current.x * 0.15;

      groupRef.current.rotation.x += (rotTargetX - groupRef.current.rotation.x) * lerpSpeed;
      groupRef.current.rotation.y += (rotTargetY - groupRef.current.rotation.y) * lerpSpeed;
    }
  });

  // Calculate dynamic scale to ensure massive text fits on mobile screens
  const responsiveScale = Math.min(1, viewport.width / 16);

  return (
    <group ref={groupRef} scale={responsiveScale}>
      <ambientLight intensity={0.5} />
      <AthenaTypography />
      <ParticleField />
    </group>
  );
}

export function Background3D() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <Suspense fallback={null}>
          <InteractiveScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
