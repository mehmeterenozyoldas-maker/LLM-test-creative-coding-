import React, { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { COLORS } from '../constants';
import * as THREE from 'three';

const Wall = (props: any) => {
  const [ref] = useBox(() => ({ type: 'Static', ...props }));
  return (
    <mesh ref={ref as any} receiveShadow castShadow visible={props.visible !== false}>
      <boxGeometry args={props.args} />
      <meshStandardMaterial 
        color={COLORS.WALL} 
        roughness={0.4} 
        metalness={0.1} 
      />
    </mesh>
  );
};

export const World: React.FC<{ projectionMode: boolean }> = ({ projectionMode }) => {
  const projectorRef = useRef<THREE.SpotLight>(null);
  
  // Animate the projector light slightly
  useFrame(({ clock }) => {
    if (projectorRef.current) {
        projectorRef.current.position.x = Math.sin(clock.getElapsedTime() * 0.5) * 2;
        projectorRef.current.intensity = projectionMode ? 200 : 0; // Only on in projection mode
    }
  });

  return (
    <group>
      {/* Lights */}
      <ambientLight intensity={0.2} />
      
      {/* Main Directional Light (Shadows) */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
      </directionalLight>

      {/* Dynamic Projector Light (Simulates a physical projector) */}
      <spotLight
        ref={projectorRef}
        position={[0, 10, 0]}
        angle={0.5}
        penumbra={0.5}
        castShadow
        color={COLORS.LIGHT_MAIN}
      />

      {/* Vaporwave Fill Lights */}
      <pointLight 
        position={[-8, 5, 0]} 
        color={COLORS.LIGHT_MAGENTA} 
        intensity={40} 
        distance={20}
        decay={2}
      />
      <pointLight 
        position={[8, 5, 0]} 
        color={COLORS.LIGHT_CYAN} 
        intensity={40} 
        distance={20}
        decay={2}
      />

      {/* Room Geometry - Cornell Box Style */}
      {/* Floor */}
      <Wall position={[0, -5, 0]} args={[20, 1, 20]} rotation={[0, 0, 0]} />
      {/* Back Wall */}
      <Wall position={[0, 5, -5]} args={[20, 20, 1]} rotation={[0, 0, 0]} />
      {/* Left Wall */}
      <Wall position={[-6, 5, 0]} args={[1, 20, 20]} rotation={[0, 0, 0]} />
      {/* Right Wall */}
      <Wall position={[6, 5, 0]} args={[1, 20, 20]} rotation={[0, 0, 0]} />
      
      {/* Invisible Front Wall for containment */}
      <Wall position={[0, 5, 6]} args={[20, 20, 1]} visible={false} />
    </group>
  );
};