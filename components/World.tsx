import React, { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { COLORS } from '../constants';
import * as THREE from 'three';

const Wall = (props: any) => {
  const [ref] = useBox(() => ({ type: 'Static', ...props }));
  return (
    <mesh ref={ref as any} receiveShadow castShadow visible={props.visible !== false}>
      <boxGeometry args={props.args} />
      <meshStandardMaterial 
        color="#030712" // Very dark background
        roughness={0.9} 
        metalness={0.1}
      />
      {/* Subtle grid lines could be nice, but pure dark makes Bloom pop more */}
    </mesh>
  );
};

export const World: React.FC = () => {
  return (
    <group>
      {/* Minimal Lights so emissive shapes stand out */}
      <ambientLight intensity={0.1} color="#1e1b4b" />
      
      {/* Directional Light for rim lighting and weak shadows */}
      <directionalLight 
        position={[10, 10, -5]} 
        intensity={0.5} 
        castShadow 
        color="#818cf8"
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
      </directionalLight>

      {/* Atmospheric Point Light (Cyan/Vaporwave) */}
      <pointLight 
        position={[-10, 5, 0]} 
        color={COLORS.LIGHT_CYAN} 
        intensity={20} 
        distance={30}
        decay={2}
      />
      {/* Atmospheric Point Light (Magenta/Vaporwave) */}
      <pointLight 
        position={[10, 5, 0]} 
        color={COLORS.LIGHT_MAGENTA} 
        intensity={20} 
        distance={30}
        decay={2}
      />

      {/* Room Geometry - Cornell Box Style */}
      {/* Floor */}
      <Wall position={[0, -5, 0]} args={[40, 1, 40]} rotation={[0, 0, 0]} />
      
      {/* Side walls moved further out so objects can spread out more */}
      <Wall position={[0, 10, -10]} args={[40, 30, 1]} rotation={[0, 0, 0]} /> {/* Back */}
      <Wall position={[-15, 10, 0]} args={[1, 30, 40]} rotation={[0, 0, 0]} /> {/* Left */}
      <Wall position={[15, 10, 0]} args={[1, 30, 40]} rotation={[0, 0, 0]} /> {/* Right */}
      
      {/* Invisible Front Wall for containment */}
      <Wall position={[0, 10, 10]} args={[40, 30, 1]} visible={false} />
      {/* Invisible Ceiling */}
      <Wall position={[0, 25, 0]} args={[40, 1, 40]} visible={false} />
    </group>
  );
};