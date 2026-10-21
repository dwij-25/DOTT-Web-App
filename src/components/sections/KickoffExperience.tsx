"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import * as THREE from "three";

// 3D Objects that float around and react to scroll
function FloatingPixels() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create some random voxel boxes
  const boxes = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 80; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 25, 
          (Math.random() - 0.5) * 50 - 15, 
          (Math.random() - 0.5) * 25
        ],
        scale: Math.random() * 0.8 + 0.2,
        color: Math.random() > 0.7 ? '#E83C3C' : '#ffffff',
        speed: Math.random() * 2 + 1,
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Calculate scroll progress (0 to 1)
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const offset = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      // Interpolate rotation and position smoothly
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, offset * Math.PI * 1.5, 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, offset * 30, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {boxes.map((box, i) => (
        <Float key={i} speed={box.speed} rotationIntensity={3} floatIntensity={4}>
          <mesh position={box.position as [number, number, number]} scale={box.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
              color={box.color} 
              emissive={box.color} 
              emissiveIntensity={box.color === '#E83C3C' ? 0.8 : 0.2} 
              roughness={0.1} 
              metalness={0.9} 
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// Giant 3D logo or central piece
function CentralCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const offset = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.8;
      
      // Target values based on scroll
      const targetY = -offset * 15;
      const targetScale = 1 + offset * 2;
      
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <octahedronGeometry args={[2, 0]} />
      <meshStandardMaterial 
        color="#E83C3C" 
        wireframe 
        emissive="#E83C3C"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export default function KickoffExperience() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
      <color attach="background" args={["#050505"]} />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#E83C3C" />
      
      <Stars radius={100} depth={50} count={7000} factor={5} saturation={0} fade speed={1.5} />
      
      <CentralCore />
      <FloatingPixels />
    </Canvas>
  );
}
