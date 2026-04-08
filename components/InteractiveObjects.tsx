import React, { useCallback, useRef } from 'react';
import { useSphere, useBox } from '@react-three/cannon';
import { AudioEngine } from '../utils/audio';
import { COLORS, VELOCITY_THRESHOLD, BOUNCINESS, PhysicalObject, WallData } from '../constants';

interface ObjectProps {
  data: PhysicalObject;
  audio: AudioEngine;
}

// Reusable collision handler to keep code DRY
const useAudioCollision = (audio: AudioEngine) => {
  // Use a ref to throttle sound on the exact same frame if needed, 
  // though Cannon usually handles discrete steps well.
  // We strictly follow the threshold rule.
  return useCallback((e: any) => {
    const velocity = e.contact.impactVelocity;
    if (velocity > VELOCITY_THRESHOLD) {
        audio.trigger(velocity);
    }
  }, [audio]);
};

export const MusicalSphere: React.FC<ObjectProps> = ({ data, audio }) => {
  const onCollide = useAudioCollision(audio);
  
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
        color={COLORS.MARBLE} 
        roughness={0.1} 
        metalness={0.1} 
      />
    </mesh>
  );
};

export const MusicalBox: React.FC<ObjectProps> = ({ data, audio }) => {
  const onCollide = useAudioCollision(audio);
  const args: [number, number, number] = [2, 0.4, 0.8]; // Plank shape

  const [ref] = useBox(() => ({
    mass: 1, // Slightly heavier feel for planks? Let's keep mass uniform for simplicity or vary it.
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
        color={COLORS.WOOD} 
        roughness={0.8} 
        metalness={0.0}
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
    restitution: 0.2,
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={data.args} />
      <meshStandardMaterial 
        color={COLORS.WALL} 
        roughness={0.5} 
        metalness={0.2}
      />
      {/* Visual outline to make it pop */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...data.args)]} />
        <lineBasicMaterial color="#445588" />
      </lineSegments>
    </mesh>
  );
};

import * as THREE from 'three';

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