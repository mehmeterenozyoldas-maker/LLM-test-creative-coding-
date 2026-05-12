import React, { useCallback, useRef } from 'react';
import { useSphere, useBox, useCylinder } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { AudioEngine } from '../utils/audio';
import { COLORS, VELOCITY_THRESHOLD, BOUNCINESS, PhysicalObject, WallData, ShapeType } from '../constants';
import * as THREE from 'three';

interface ObjectProps {
  data: PhysicalObject;
  audio: AudioEngine;
}

const useAudioCollision = (audio: AudioEngine, materialRef: React.RefObject<THREE.MeshStandardMaterial | null>, type: 'light' | 'heavy' = 'light') => {
  return useCallback((e: any) => {
    const velocity = e.contact.impactVelocity;
    if (velocity > VELOCITY_THRESHOLD) {
        audio.trigger(velocity, type);
        if (materialRef.current) {
            materialRef.current.emissiveIntensity = Math.min(velocity * 0.5, 4);
        }
    }
  }, [audio, materialRef, type]);
};

// Hook to decay emissive intensity
const useEmissiveDecay = (materialRef: React.RefObject<THREE.MeshStandardMaterial | null>) => {
    useFrame((state, delta) => {
        if (materialRef.current && materialRef.current.emissiveIntensity > 0) {
            materialRef.current.emissiveIntensity = Math.max(0, materialRef.current.emissiveIntensity - delta * 5);
        }
    });
};

export const MusicalSphere: React.FC<ObjectProps> = ({ data, audio }) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const onCollide = useAudioCollision(audio, materialRef, 'light');
  useEmissiveDecay(materialRef);
  
  const [ref] = useSphere(() => ({
    mass: 1,
    position: data.position,
    args: [0.6],
    restitution: BOUNCINESS,
    onCollide,
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial 
        ref={materialRef}
        color={COLORS.MARBLE}
        emissive={COLORS.EMISSIVE_SPHERE}
        emissiveIntensity={0}
        roughness={0.1} 
        metalness={0.5} 
      />
    </mesh>
  );
};

export const MusicalBox: React.FC<ObjectProps> = ({ data, audio }) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const onCollide = useAudioCollision(audio, materialRef, 'heavy');
  useEmissiveDecay(materialRef);
  const args: [number, number, number] = [2, 0.4, 0.8];

  const [ref] = useBox(() => ({
    mass: 2, 
    position: data.position,
    rotation: data.rotation,
    args: args,
    restitution: BOUNCINESS,
    onCollide,
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial 
        ref={materialRef}
        color={COLORS.WOOD} 
        emissive={COLORS.EMISSIVE_BOX}
        emissiveIntensity={0}
        roughness={0.8} 
        metalness={0.1}
      />
    </mesh>
  );
};

export const MusicalCylinder: React.FC<ObjectProps> = ({ data, audio }) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const onCollide = useAudioCollision(audio, materialRef, 'light');
  useEmissiveDecay(materialRef);
  const args: [number, number, number, number] = [0.5, 0.5, 2, 16]; // radiusTop, radiusBottom, height, radialSegments

  const [ref] = useCylinder(() => ({
    mass: 1.5,
    position: data.position,
    rotation: data.rotation,
    args: args,
    restitution: BOUNCINESS * 1.2,
    onCollide,
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial 
        ref={materialRef}
        color="#22D3EE" 
        emissive="#06B6D4"
        emissiveIntensity={0}
        roughness={0.3} 
        metalness={0.8}
      />
    </mesh>
  );
};

// Static Wall created by the user
export const CustomWall: React.FC<{ data: WallData }> = ({ data }) => {
  const [ref] = useBox(() => ({
    type: 'Static',
    position: data.position,
    args: data.args,
    restitution: BOUNCINESS,
  }));

  const bandHeight = Math.min(data.args[1] * 0.15, 0.4);
  const bandArgs: [number, number, number] = [
    data.args[0] + 0.04, 
    bandHeight, 
    data.args[2] + 0.04
  ];

  return (
    <group ref={ref as any}>
      {/* Dark Polished Oak Main Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={data.args} />
        <meshStandardMaterial 
          color="#1e130c" // Dark oak base
          roughness={0.2} // Polished
          metalness={0.1}
        />
        {/* Procedural wood-like color variation could be added, but a solid rich dark color with low roughness handles "polished dark oak" decently without textures. */}
      </mesh>
      
      {/* Copper Band Accent */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={bandArgs} />
        <meshStandardMaterial 
          color="#b87333" // Copper color
          roughness={0.15} 
          metalness={0.9} // Highly metallic
        />
      </mesh>
    </group>
  );
};

// Visual preview while dragging
export const GhostWall: React.FC<{ start: [number, number, number], end: [number, number, number], height: number }> = ({ start, end, height }) => {
    const width = Math.abs(end[0] - start[0]) || 0.1;
    const depth = Math.abs(end[2] - start[2]) || 0.1;
    const x = (start[0] + end[0]) / 2;
    const z = (start[2] + end[2]) / 2;

    return (
        <mesh position={[x, height / 2, z]}>
            <boxGeometry args={[width, height, depth]} />
            <meshBasicMaterial color={COLORS.GHOST} transparent opacity={0.3} wireframe />
        </mesh>
    );
};